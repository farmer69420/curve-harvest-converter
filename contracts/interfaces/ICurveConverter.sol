pragma solidity 0.5.16;

interface ICurveConverter {
    
    function depositAll(uint256[] calldata amount, uint256 minimum) external;

}