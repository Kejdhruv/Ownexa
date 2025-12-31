// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract PropertyToken is ERC1155, Ownable {

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

    Property[] public allProperty;


    mapping(uint256 => uint256) public primaryRemaining;


    uint256 public listingCounter;
    mapping(uint256 => Listing) public listings;


    mapping(uint256 => address) public propertyLister;

    constructor()
        ERC1155("")
        Ownable(msg.sender)
    {}
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
    }
    function buyTokens(uint256 _propertyId, uint256 _amount) external payable {
        require(_propertyId < allProperty.length, "Invalid property");
        require(_amount > 0, "Invalid amount");

        Property storage property = allProperty[_propertyId];
        require(property.active, "Property not active");

        require(primaryRemaining[_propertyId] >= _amount, "Not enough primary tokens");

        uint256 basePrice = property.pricepertoken * _amount;
        uint256 commission = (basePrice * 2) / 100;
        uint256 totalPrice = basePrice + commission;

        require(msg.value == totalPrice, "Incorrect ETH sent");
        primaryRemaining[_propertyId] -= _amount;

        safeTransferFrom(address(this), msg.sender, _propertyId, _amount, "");
    }

    function createListing(
        uint256 _propertyId,
        uint256 _amount,
        uint256 _price
    ) external {
        require(_propertyId < allProperty.length, "Invalid property");
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
    } 


    function cancelListing(uint256 _listingId) external {
        require(_listingId < listingCounter, "Invalid listing");

        Listing storage listing = listings[_listingId];

        require(listing.active, "Listing not active");
        require(listing.seller == msg.sender, "Not listing owner");

        listing.active = false;


        safeTransferFrom(
            address(this),
            msg.sender,
            listing.propertyId,
            listing.amount,
            ""
        );
    }

    function buyListing(uint256 _listingId) external payable {
        Listing storage listing = listings[_listingId];

        require(listing.active, "Listing not active");

        uint256 basePrice = listing.pricepertoken * listing.amount;
        uint256 commission = (basePrice * 2) / 100;
        uint256 totalPrice = basePrice + commission;

        require(msg.value == totalPrice, "Incorrect ETH sent");

        listing.active = false;
         
        uint256 pricetosend = basePrice - commission ; 
        payable(listing.seller).transfer(pricetosend);

        safeTransferFrom(
            address(this),
            msg.sender,
            listing.propertyId,
            listing.amount,
            ""
        );
    }
}