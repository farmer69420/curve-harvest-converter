pragma solidity 0.5.16;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/math/Math.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";
import "./interfaces/ICurveFiWbtc.sol";
import "./interfaces/IVault.sol";



contract CurveConverterRENBTC {
  using Address for address;
  using SafeMath for uint256;
  using SafeERC20 for IERC20;

  // crvRenWBTC
  address public underlying;
  address public curve;
  address public renbtc;
  address public wbtc;
  address public vault;

  event DepositVault(uint256 amount);
  event DepositCurve(uint256 _amountRENBTC, uint256 _amountWBTC, uint256 underlyingBalance);

  constructor(
    address _vault,
    address _underlying,
    address _curve,
    address _renbtc,
    address _wbtc
  )
  public {
    require(IVault(_vault).underlying() == _underlying, "vault does not support crvRenWBTC");
    vault = _vault;
    underlying = _underlying;
    curve = _curve;
    renbtc = _renbtc;
    wbtc = _wbtc;
  }
  /**
  * Deposit crvRenWBTC to Harvest Vault.
  */
  function depositVault(uint256 amount) internal {
    IERC20(underlying).safeApprove(vault, 0);
    IERC20(underlying).safeApprove(vault, amount);
  
    emit DepositVault(amount);
    
    IVault(vault).depositFor(amount, msg.sender);
   }

  /**
  * Deposit renbtc and/or wbtc, convert to the crvRenWBTC tokens and deposit them to the Harvest Vault.
  */
  function depositAll(uint256 amountRENBTC, uint256 amountWBTC) public {

    uint256 amountUnderlying = depositCurvePool(amountRENBTC, amountWBTC);

    depositVault(amountUnderlying);
  }

  /**
  * Uses the Curve protocol to convert the underlying assets into the mixed token.
  */
  function depositCurvePool(
    uint256 _amountRENBTC, 
    uint256 _amountWBTC
    ) internal returns (uint256) {
    require(_amountRENBTC > 0 || _amountWBTC > 0, "nothing to deposit");
    
    if (_amountRENBTC > 0) {
      IERC20(renbtc).safeTransferFrom(msg.sender, address(this), _amountRENBTC);
      IERC20(renbtc).safeApprove(curve, 0);
      IERC20(renbtc).safeApprove(curve, _amountRENBTC);
    }
    if (_amountWBTC > 0) {
      IERC20(wbtc).safeTransferFrom(msg.sender, address(this), _amountWBTC);
      IERC20(wbtc).safeApprove(curve, 0);
      IERC20(wbtc).safeApprove(curve, _amountWBTC);
    }
   
    uint256 minimum = 0;

    ICurveFiWbtc(curve).add_liquidity([_amountRENBTC, _amountWBTC], minimum);
    
    uint256 received = IERC20(underlying).balanceOf(address(this));
    require(received > 0, "nothing received from curve");

    emit DepositCurve(_amountRENBTC, _amountWBTC, received);
    return received;
  }
}