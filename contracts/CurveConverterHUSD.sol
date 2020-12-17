pragma solidity 0.5.16;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/math/Math.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";
import "./interfaces/ICurveHUSDDeposit.sol";
import "./interfaces/IVault.sol";



contract CurveConverterHUSD {
  using Address for address;
  using SafeMath for uint256;
  using SafeERC20 for IERC20;
  
  // 3CRV
  address public underlying;
  address public curve;
  address public dai;
  address public usdc;
  address public usdt;
  address public husd;
  address public vault;

  event DepositVault(uint256 amount);
  event DepositCurve(uint256 _amountDai, uint256 _amountUsdc,uint256 _amountUsdt, uint256 _amountHusd, uint256 underlyingBalance);

  constructor(
    address _vault,
    address _underlying,
    address _curve,
    address _dai,
    address _usdc,
    address _usdt,
    address _husd
  )
  public {
    require(IVault(_vault).underlying() == _underlying, "vault does not support 3CRV");
    vault = _vault;
    underlying = _underlying;
    curve = _curve;
    dai = _dai;
    usdc = _usdc;
    usdt = _usdt;
    husd = _husd;
  }
  /**
  * Deposit 3CRV to Harvest Vault.
  */
  function depositVault(uint256 amount) internal {
    IERC20(underlying).safeApprove(vault, 0);
    IERC20(underlying).safeApprove(vault, amount);
  
    emit DepositVault(amount);
    
    IVault(vault).depositFor(amount, msg.sender);
   }

  /**
  * Deposit DAI, USDC and USDT, convert to the 3CRV tokens and deposit them to the Harvest Vault.
  */
  function depositAll(uint256 amountDai, uint256 amountUsdc, uint256 amountUsdt, uint256 amountHusd) public {

    uint256 amountUnderlying = depositCurve(amountDai, amountUsdc, amountUsdt, amountHusd);

    depositVault(amountUnderlying);
  }

  /**
  * Uses the Curve protocol to convert the underlying assets into the mixed token.
  */
  function depositCurve(
    uint256 _amountDai, 
    uint256 _amountUsdc, 
    uint256 _amountUsdt,
    uint256 _amountHusd
    ) internal returns (uint256) {
    require(_amountDai > 0 || _amountUsdc > 0 || _amountUsdt > 0 || _amountHusd > 0, "nothing to deposit");
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
    if (_amountHusd > 0) {
      IERC20(husd).safeTransferFrom(msg.sender, address(this), _amountHusd);
      IERC20(husd).safeApprove(curve, 0);
      IERC20(husd).safeApprove(curve, _amountHusd);
    }
   
    uint256 minimum = 0;

    ICurveHUSDDeposit(curve).add_liquidity([ _amountHusd, _amountDai, _amountUsdc, _amountUsdt], minimum);
    
    uint256 received = IERC20(underlying).balanceOf(address(this));
    require(received > 0, "nothing received from curve");

    emit DepositCurve(_amountDai, _amountUsdc, _amountUsdt, _amountHusd, received);
    return received;
  }
}