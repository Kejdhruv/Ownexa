// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract PropertyToken is ERC1155, Ownable {

    // =========================
    // STRUCTS
    // =========================

    struct Property {
        uint256 id;
        uint256 tokensupply;
        string tokename;
        uint256 pricepertoken;
        bool active;
    }

    struct Listing {
        uint256 listingId;
        uint256 propertyId;
        uint256 amount;
        uint256 pricepertoken;
        address seller;
        bool active;
    }

    // =========================
    // STORAGE
    // =========================

    Property[] public allProperty;

    mapping(uint256 => uint256) public primaryRemaining;
    mapping(uint256 => uint256) public settlementPool;
    mapping(uint256 => bool) public settled;

    uint256 public listingCounter;
    mapping(uint256 => Listing) public listings;

    mapping(uint256 => address) public propertyLister;

    uint256 public accumulatedCommission;

    // =========================
    // EVENTS
    // =========================
    event PropertyListed(uint256 indexed propertyId, address indexed owner, uint256 tokenSupply, uint256 pricePerToken);
    event PrimaryTokensBought(uint256 indexed propertyId, address indexed buyer, uint256 amount, uint256 totalPrice);
    event ListingCreated(uint256 indexed listingId, uint256 indexed propertyId, address indexed seller, uint256 amount, uint256 pricePerToken);
    event ListingCancelled(uint256 indexed listingId, address indexed seller);
    event ListingBought(uint256 indexed listingId, address indexed buyer, uint256 totalPrice);
    event PropertySettled(uint256 indexed propertyId, uint256 settlementAmount);
    event TokensRedeemed(uint256 indexed propertyId, address indexed user, uint256 tokenAmount, uint256 payout);

    // =========================
    // CONSTRUCTOR
    // =========================

    constructor() ERC1155("") Ownable(msg.sender) {}

    // =========================
    // PROPERTY LISTING (MINT)
    // =========================

    function listProperty(
        uint256 _tokensupply,
        uint256 _pricepertoken,
        string memory _tokename
    ) external {
        require(_tokensupply > 0, "Invalid token supply");
        require(_pricepertoken > 0, "Invalid price");

        uint256 propertyId = allProperty.length;

        allProperty.push(
            Property({
                id: propertyId,
                tokensupply: _tokensupply,
                tokename: _tokename,
                pricepertoken: _pricepertoken,
                active: true
            })
        );

        propertyLister[propertyId] = msg.sender;

        _mint(address(this), propertyId, _tokensupply, "");
        primaryRemaining[propertyId] = _tokensupply;
        emit PropertyListed(propertyId, msg.sender, _tokensupply, _pricepertoken);
    }

    // =========================
    // PRIMARY BUY
    // =========================

    function buyTokens(uint256 _propertyId, uint256 _amount) external payable {
        require(_propertyId < allProperty.length, "Invalid property");
        require(_amount > 0, "Invalid amount");

        Property storage property = allProperty[_propertyId];
        require(property.active, "Property not active");
        require(primaryRemaining[_propertyId] >= _amount, "Not enough tokens");

        uint256 basePrice = property.pricepertoken * _amount;
        uint256 commission = (basePrice * 2) / 100;
        uint256 totalPrice = basePrice + commission;

        require(msg.value == totalPrice, "Incorrect ETH sent");

        // pay property owner the base price
        payable(propertyLister[_propertyId]).transfer(basePrice);

        accumulatedCommission += commission;

        primaryRemaining[_propertyId] -= _amount;

        safeTransferFrom(
            address(this),
            msg.sender,
            _propertyId,
            _amount,
            ""
        );
        emit PrimaryTokensBought(_propertyId, msg.sender, _amount, msg.value);
    }

    // =========================
    // CREATE LISTING
    // =========================

    function createListing(
        uint256 _propertyId,
        uint256 _amount,
        uint256 _price
    ) external {
        require(_propertyId < allProperty.length, "Invalid property");
        require(allProperty[_propertyId].active, "Property not active");
        require(_amount > 0, "Invalid amount");
        require(_price > 0, "Invalid price");
        require(balanceOf(msg.sender, _propertyId) >= _amount, "Not enough tokens");

        uint256 listingId = listingCounter++;

        safeTransferFrom(
            msg.sender,
            address(this),
            _propertyId,
            _amount,
            ""
        );

        listings[listingId] = Listing({
            listingId: listingId,
            propertyId: _propertyId,
            amount: _amount,
            pricepertoken: _price,
            seller: msg.sender,
            active: true
        });
        emit ListingCreated(listingId, _propertyId, msg.sender, _amount, _price);
    }

    // =========================
    // CANCEL LISTING
    // =========================

    function cancelListing(uint256 _listingId) external {
        require(_listingId < listingCounter, "Invalid listing");

        Listing storage listing = listings[_listingId];
        require(listing.active, "Listing not active");
        require(listing.seller == msg.sender, "Not owner");

        listing.active = false;
        emit ListingCancelled(_listingId, msg.sender);

        safeTransferFrom(
            address(this),
            msg.sender,
            listing.propertyId,
            listing.amount,
            ""
        );
    }

    // =========================
    // BUY LISTING (SECONDARY)
    // =========================

    function buyListing(uint256 _listingId) external payable {
        Listing storage listing = listings[_listingId];

        require(listing.active, "Listing not active");
        require(allProperty[listing.propertyId].active, "Property not active");

        uint256 basePrice = listing.pricepertoken * listing.amount;
        uint256 commission = (basePrice * 2) / 100;
        uint256 totalPrice = basePrice + commission;

        require(msg.value == totalPrice, "Incorrect ETH sent");

        accumulatedCommission += commission;

        listing.active = false;
        emit ListingBought(_listingId, msg.sender, msg.value);

        payable(listing.seller).transfer(basePrice);

        safeTransferFrom(
            address(this),
            msg.sender,
            listing.propertyId,
            listing.amount,
            ""
        );
    }

    // =========================
    // SETTLE PROPERTY
    // =========================

    function settleProperty(uint256 _propertyId) external payable onlyOwner {
        require(_propertyId < allProperty.length, "Invalid property");

        Property storage property = allProperty[_propertyId];
        require(property.active, "Already settled");
        require(msg.value > 0, "No ETH sent");

        property.active = false;
        settlementPool[_propertyId] = msg.value;
        settled[_propertyId] = true;
        emit PropertySettled(_propertyId, msg.value);
    }

    // =========================
    // REDEEM TOKENS
    // =========================

    function redeemTokens(uint256 _propertyId) external {
        require(_propertyId < allProperty.length, "Invalid property");
        require(settled[_propertyId], "Not settled");

        uint256 userBalance = balanceOf(msg.sender, _propertyId);
        require(userBalance > 0, "No tokens");

        uint256 totalSupply = allProperty[_propertyId].tokensupply;
        uint256 payout = (settlementPool[_propertyId] * userBalance) / totalSupply;

        _burn(msg.sender, _propertyId, userBalance);
        payable(msg.sender).transfer(payout);
        emit TokensRedeemed(_propertyId, msg.sender, userBalance, payout);
    } 

    function withdrawCommission(address payable _to) external onlyOwner {
        require(_to != address(0), "Invalid address");
        require(accumulatedCommission > 0, "No commission to withdraw");

        uint256 amount = accumulatedCommission;
        accumulatedCommission = 0;

        _to.transfer(amount);
    }
    
}