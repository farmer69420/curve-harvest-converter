pragma solidity 0.5.16;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/math/Math.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";
import "./interfaces/ICurveBUSDDeposit.sol";
import "./interfaces/IVault.sol";



contract CurveConverterBUSD {
  using Address for address;
  using SafeMath for uint256;
  using SafeERC20 for IERC20;
  
  // CRV-BUSD
  address public underlying;
  address public curve;
  address public dai;
  address public usdc;
  address public usdt;
  address public busd;
  address public vault;

  event DepositVault(uint256 amount);
  event DepositBUSD(
    uint256 _amountDai, 
    uint256 _amountUsdc,
    uint256 _amountUsdt, 
    uint256 _amountBusd, 
    uint256 underlyingBalance
    );

  constructor(
    address _vault,
    address _underlying,
    address _curve,
    address _dai,
    address _usdc,
    address _usdt,
    address _busd
  )
  public {
    require(IVault(_vault).underlying() == _underlying, "vault does not support CRV-BUSD");
    vault = _vault;
    underlying = _underlying;
    curve = _curve;
    dai = _dai;
    usdc = _usdc;
    usdt = _usdt;
    busd = _busd;
  }
  /**
  * Deposit CRV-BUSD to Harvest Vault.
  */
  function depositVault(uint256 amount) internal {
    IERC20(underlying).safeApprove(vault, 0);
    IERC20(underlying).safeApprove(vault, amount);
  
    emit DepositVault(amount);
    
    IVault(vault).depositFor(amount, msg.sender);
   }

  /**
  * Deposit DAI, USDC and USDT, BUSD, convert to the CRV-BUSD tokens and deposit them to the Harvest Vault.
  */
  function depositAll(uint256 amountDai, uint256 amountUsdc, uint256 amountUsdt, uint256 amountBusd) public {

    uint256 amountUnderlying = depositCurve(amountDai, amountUsdc, amountUsdt, amountBusd);

    depositVault(amountUnderlying);
  }

  /**
  * Uses the Curve protocol to convert the underlying assets into the mixed token.
  */
  function depositCurve(
    uint256 _amountDai, 
    uint256 _amountUsdc, 
    uint256 _amountUsdt,
    uint256 _amountBusd
    ) internal returns (uint256) {
    require(
      _amountDai > 0 || _amountUsdc > 0 || _amountUsdt > 0 || _amountBusd > 0,
     "nothing to deposit"
     );
    if (_amountDai > 0) {
      IERC20(dai).safeTransferFrom(msg.sender, address(this), _amountDai);
      IERC20(dai).safeApprove(curve, 0);
      IERC20(dai).safeApprove(curve, _amountDai);
    }
    if (_amountUsdc > 0) {
      IERC20(usdc).safeTransferFrom(msg.sender, address(this), _amountUsdc);
      IERC20(usdc).safeApprove(curve, 0);
      IERC20(usdc).safeApprove(curve, _amountUsdc);
    }
    if (_amountUsdt > 0) {
      IERC20(usdt).safeTransferFrom(msg.sender, address(this), _amountUsdt);
      IERC20(usdt).safeApprove(curve, 0);
      IERC20(usdt).safeApprove(curve, _amountUsdt);
    }
    if (_amountBusd > 0) {
      IERC20(busd).safeTransferFrom(msg.sender, address(this), _amountBusd);
      IERC20(busd).safeApprove(curve, 0);
      IERC20(busd).safeApprove(curve, _amountBusd);
    }
    uint256 minimum = 0;

    ICurveBUSDDeposit(curve).add_liquidity([_amountDai, _amountUsdc, _amountUsdt, _amountBusd], minimum);
    
    uint256 received = IERC20(underlying).balanceOf(address(this));
    require(received > 0, "nothing received from curve");

    emit DepositBUSD(_amountDai, _amountUsdc, _amountUsdt, _amountBusd, received);
    return received;
  }
}