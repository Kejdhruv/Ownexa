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

    Property[] public allProperty;

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
    }

    function buyTokens(uint256 _propertyId, uint256 _amount) external payable {
    require(_propertyId < allProperty.length, "Invalid property");
    require(_amount > 0, "Invalid amount");

    Property storage property = allProperty[_propertyId];
    require(property.active, "Property not active");

    uint256 available = balanceOf(address(this), _propertyId);
    require(available >= _amount, "Not enough tokens left");

    uint256 basePrice = property.pricepertoken * _amount;
    uint256 commission = (basePrice * 2) / 100;

    uint256 totalPrice = basePrice + commission;

    require(msg.value == totalPrice, "Incorrect ETH sent");

    safeTransferFrom(address(this), msg.sender, _propertyId, _amount, "");
}
}