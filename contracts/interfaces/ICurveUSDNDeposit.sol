pragma solidity 0.5.16;

interface ICurveUSDNDeposit {
    function get_virtual_price() external view returns (uint);
    function add_liquidity(
        uint256[4] calldata amounts,
        uint256 min_mint_amount
    ) external;
}
