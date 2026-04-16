# Ownexa Smart Contract

This folder contains the blockchain layer for Ownexa. It is a Hardhat-based Solidity project centered around a single ERC-1155 contract, `PropertyToken`, which models fractional real-estate ownership, primary sales, secondary listings, settlement, redemption, and platform commission.

The contract is designed to work alongside the rest of the platform:

- the frontend handles wallet interaction with MetaMask and ethers.js
- the backend persists off-chain marketplace and analytics state
- this contract enforces the on-chain token ownership and value-transfer logic

## What The Contract Does

Each property is represented as an ERC-1155 token id.

For every property:

- a total token supply is created
- the initial token supply is minted to the contract itself
- investors buy from the contract in the primary market
- token holders can move tokens into escrow for secondary listing
- other investors can buy those listed tokens
- the property owner can settle the property by funding a payout pool
- token holders can redeem their holdings after settlement

This gives the project a compact multi-asset token model where one contract manages many properties through token ids.

## Tech Stack

- Solidity `^0.8.x`
- Hardhat
- OpenZeppelin Contracts v5
- Ethers.js
- Sepolia deployment support through environment variables

## Folder Structure

```text
Contract/
├── contracts/
│   └── PropertyToken.sol
├── scripts/
│   └── Deploy.js
├── hardhat.config.js
├── package.json
└── README.md
```

## Main Contract

The core contract is [`contracts/PropertyToken.sol`](/Users/dhruv/Blockchain/Ownexa/Contract/contracts/PropertyToken.sol).

Inheritance:

- `ERC1155`
- `ERC1155Holder`
- `Ownable`

### Why ERC-1155

ERC-1155 is a good fit here because:

- one contract can represent many properties
- each property maps naturally to a token id
- balances are tracked per user and per property
- the contract can escrow its own inventory and active listings

## Conceptual Model

### Property

Each property has:

- `id`
- total token supply
- token name
- primary price per token
- settlement price per token
- active/inactive state

### Listing

Each secondary listing has:

- listing id
- linked property id
- amount of tokens listed
- price per token
- seller address
- active/inactive state

## Storage Layout

The contract stores:

- `Property[] public allProperty`
- `mapping(uint256 => uint256) public primaryRemaining`
- `mapping(uint256 => uint256) public settlementPool`
- `mapping(uint256 => bool) public settled`
- `uint256 public listingCounter`
- `mapping(uint256 => Listing) public listings`
- `mapping(uint256 => address) public propertyLister`
- `uint256 public accumulatedCommission`

### Meaning Of Each Mapping

- `primaryRemaining[propertyId]`: unsold primary inventory remaining for that property
- `settlementPool[propertyId]`: ETH reserved for token redemptions after settlement
- `settled[propertyId]`: whether the property has entered settlement mode
- `listings[listingId]`: on-chain record for each secondary listing
- `propertyLister[propertyId]`: original property owner/lister address

## Events

The contract emits these events:

- `PropertyListed`
- `PrimaryTokensBought`
- `ListingCreated`
- `ListingCancelled`
- `ListingBought`
- `PropertySettled`
- `TokensRedeemed`

These are the key hooks you would use if you later add event indexing, subgraph support, or richer portfolio synchronization.

## Contract Lifecycle

### 1. Property Listing

The property owner or platform flow calls `listProperty(...)`.

What happens:

- a new `Property` struct is pushed into `allProperty`
- the property receives a new token id equal to `allProperty.length` before insertion
- the total supply is minted to `address(this)`
- the lister address is recorded in `propertyLister`
- `primaryRemaining[propertyId]` is initialized

Effectively, the contract holds the initial sale inventory in escrow.

### 2. Primary Purchase

An investor calls `buyTokens(propertyId, amount)` with ETH.

What happens:

- the contract validates the property and available remaining supply
- total cost is calculated as:
  - `basePrice = pricePerToken * amount`
  - `commission = 2% of basePrice`
  - `totalPrice = basePrice + commission`
- the base price is sent to the original property lister
- the commission is retained in `accumulatedCommission`
- token inventory is transferred from the contract to the buyer

### 3. Secondary Listing

A holder calls `createListing(propertyId, amount, price)`.

What happens:

- the contract checks holder balance
- listed tokens are transferred from the seller to `address(this)`
- a `Listing` struct is stored
- the listing becomes active

This means the contract becomes the escrow holder for listed tokens.

### 4. Secondary Purchase

A buyer calls `buyListing(listingId)` with ETH.

What happens:

- the contract validates the listing and property state
- total cost is calculated using the same 2% commission model
- base price is sent to the seller
- commission is added to `accumulatedCommission`
- listed tokens move from the contract to the buyer
- listing is marked inactive

### 5. Settlement

The original property lister calls `settleProperty(propertyId)` and sends ETH.

What happens:

- the contract verifies the caller is the property lister
- a new settlement price per token is computed:
  - `msg.value / totalSupply`
- unsold tokens held by the contract are identified
- those unsold tokens are burned
- the owner is refunded for unsold inventory at the new settlement price
- the remaining ETH is stored in `settlementPool[propertyId]`
- the property becomes inactive
- `settled[propertyId]` becomes `true`

### 6. Redemption

Any holder calls `redeemTokens(propertyId)` after settlement.

What happens:

- the holder’s remaining balance for that token id is read
- payout is calculated as:
  - `userBalance * settlementPrice`
- user tokens are burned
- `settlementPool[propertyId]` is reduced
- ETH payout is sent to the holder

## Public Functions

### `listProperty(address lister, uint256 _tokensupply, uint256 _pricepertoken, string memory _tokename)`

Creates a new tokenized property.

Key requirements:

- `_tokensupply > 0`
- `_pricepertoken > 0`

Effects:

- creates a property id
- stores the lister address
- mints total supply to the contract
- marks the property active

### `buyTokens(uint256 _propertyId, uint256 _amount)`

Primary market purchase.

Key requirements:

- valid property id
- positive amount
- property must be active
- enough primary inventory must remain
- exact ETH must be sent

Effects:

- pays lister
- stores 2% commission
- transfers tokens to buyer

### `createListing(uint256 _propertyId, uint256 _amount, uint256 _price)`

Creates a secondary market listing.

Key requirements:

- valid property id
- property must be active
- positive amount
- positive price
- seller must own enough tokens

Effects:

- moves tokens from seller to contract escrow
- creates a new active listing

### `cancelListing(uint256 _listingId)`

Cancels a secondary listing.

Key requirements:

- listing must exist
- listing must still be active
- caller must be the original seller

Effects:

- marks listing inactive
- returns escrowed tokens to the seller

### `buyListing(uint256 _listingId)`

Buys an active secondary listing.

Key requirements:

- listing must be active
- underlying property must still be active
- exact ETH must be sent including commission

Effects:

- pays seller
- stores 2% commission
- transfers tokens to buyer
- marks listing inactive

### `settleProperty(uint256 _propertyId)`

Settles a property.

Key requirements:

- valid property id
- property must still be active
- caller must be the original property lister
- non-zero ETH must be sent

Effects:

- computes settlement price
- burns unsold contract-held tokens
- refunds owner for unsold units
- funds the settlement pool
- disables the property for further trading

### `redeemTokens(uint256 _propertyId)`

Redeems settled property tokens.

Key requirements:

- property must be settled
- caller must hold tokens
- settlement pool must be sufficient

Effects:

- burns caller balance
- sends ETH payout

### `withdrawCommission()`

Withdraws platform commission.

Key requirements:

- caller must be the contract owner
- there must be non-zero accumulated commission

Effects:

- transfers commission to `owner()`
- resets `accumulatedCommission`

## Pricing And Commission Logic

Both primary and secondary market buys apply a platform commission:

- `commission = (basePrice * 2) / 100`
- buyer pays `basePrice + commission`

Where:

- `basePrice = pricePerToken * amount`

The base price goes to:

- the property lister for primary sales
- the seller for secondary sales

The 2% commission stays in the contract until withdrawn by the contract owner.

## Deployment

Deployment script:

- [`scripts/Deploy.js`](/Users/dhruv/Blockchain/Ownexa/Contract/scripts/Deploy.js)

Hardhat config:

- [`hardhat.config.js`](/Users/dhruv/Blockchain/Ownexa/Contract/hardhat.config.js)

### Environment Variables

Create `Contract/.env`:

```env
SEPOLIA_RPC_URL=your_rpc_url
PRIVATE_KEY=your_wallet_private_key
```

### Install Dependencies

```bash
cd Contract
npm install
```

### Compile

```bash
cd Contract
npx hardhat compile
```

### Deploy To Sepolia

```bash
cd Contract
npx hardhat run scripts/Deploy.js --network sepolia
```

### What The Deploy Script Does

The deploy script:

- gets the deployer signer
- logs deployer address and ETH balance
- deploys `PropertyToken`
- uses explicit gas settings:
  - `gasLimit: 6_000_000`
  - `maxFeePerGas: 3 gwei`
  - `maxPriorityFeePerGas: 2 gwei`
- waits for deployment confirmation
- prints the deployed contract address

## Local Development Notes

The package currently includes Hardhat-related tooling for:

- ethers integration
- typechain
- gas reporting
- coverage
- ignition

However, this specific contract folder currently does not include:

- implemented Solidity unit tests
- scripts beyond deployment
- verification scripts
- ABI export automation to the frontend

## Integration Notes

The frontend should use:

- the deployed contract address
- the compiled ABI from Hardhat artifacts

In this repository, the frontend already contains:

- `Frontend/src/abi/PropertyToken.json`

After redeploying, you should make sure:

1. the deployed address is updated in frontend environment config
2. the ABI remains in sync with the deployed bytecode

## Important Contract Caveats

These are important limitations and behaviors visible from the current code:

- `listProperty(...)` is `external` and is not restricted by `onlyOwner`, so any caller can create a property entry and set any `lister` address.
- Settlement is restricted to `propertyLister[propertyId]`, not the contract owner.
- ERC-1155 metadata URI is initialized as an empty string in the constructor, so token metadata URIs are not currently configured.
- The contract stores `tokename` and `pricepertoken` directly in the `Property` struct, but naming is inconsistent and could be cleaned up in a future refactor.
- There is no pause mechanism or emergency admin guard beyond the existing ownership functions.
- No reentrancy guard is present on payable flows that transfer ETH.
- There are no contract tests in the repo right now.
- `buyTokens` and `buyListing` require exact `msg.value`, so frontend-side price calculations must match precisely.

## Security And Design Considerations

Before moving this contract toward production use, it would be wise to review:

- access control for property creation
- reentrancy protection around ETH transfer flows
- event completeness for indexing
- settlement economics and edge cases
- precision/rounding behavior in integer division during settlement
- front-end/back-end synchronization when on-chain and off-chain state diverge

## Suggested Improvements

- add Solidity unit tests for all state transitions
- add `ReentrancyGuard` to payable execution paths
- decide whether `listProperty` should be owner-restricted, admin-restricted, or permissionless
- add metadata URI support for ERC-1155 tokens
- standardize naming like `tokename` to `tokenName`
- emit more detailed events if analytics/indexing will depend on them
- add Hardhat verification and test scripts to `package.json`
- add a local deployment script for `hardhat node`

## Useful Commands

Install:

```bash
cd Contract
npm install
```

Compile:

```bash
cd Contract
npx hardhat compile
```

Show available tasks:

```bash
cd Contract
npx hardhat help
```

Deploy:

```bash
cd Contract
npx hardhat run scripts/Deploy.js --network sepolia
```

## Quick Start

1. Add `SEPOLIA_RPC_URL` and `PRIVATE_KEY` to `Contract/.env`.
2. Run `npm install`.
3. Compile with `npx hardhat compile`.
4. Deploy with `npx hardhat run scripts/Deploy.js --network sepolia`.
5. Copy the deployed address into the frontend environment configuration.
6. Keep the frontend ABI synchronized with the compiled contract.
