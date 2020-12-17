pragma solidity 0.5.16;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/math/Math.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";
import "./interfaces/ICurveHBTC.sol";
import "./interfaces/IVault.sol";



contract CurveConverterHBTC {
  using Address for address;
  using SafeMath for uint256;
  using SafeERC20 for IERC20;
  
  // hCRV
  address public underlying;
  address public curve;
  address public hbtc;
  address public wbtc;
  address public vault;

  event DepositVault(uint256 amount);
  event DepositCurve(uint256 _amountHBTC, uint256 _amountWBTC, uint256 underlyingBalance);

  constructor(
    address _vault,
    address _underlying,
    address _curve,
    address _hbtc,
    address _wbtc
  )
  public {
    require(IVault(_vault).underlying() == _underlying, "vault does not support hCRV");
    vault = _vault;
    underlying = _underlying;
    curve = _curve;
    hbtc = _hbtc;
    wbtc = _wbtc;
  }
  /**
  * Deposit hCRV to Harvest Vault.
  */
  function depositVault(uint256 amount) internal {
    IERC20(underlying).safeApprove(vault, 0);
    IERC20(underlying).safeApprove(vault, amount);
  
    emit DepositVault(amount);
    
    IVault(vault).depositFor(amount, msg.sender);
   }

  /**
  * Deposit hbtc and/or wbtc, convert to the hCRV tokens and deposit them to the Harvest Vault.
  */
  function depositAll(uint256 amountHBTC, uint256 amountWBTC) public {

    uint256 amountUnderlying = depositCurvePool(amountHBTC, amountWBTC);

    depositVault(amountUnderlying);
  }

  /**
  * Uses the Curve protocol to convert the underlying assets into the mixed token.
  */
  function depositCurvePool(
    uint256 _amountHBTC, 
    uint256 _amountWBTC
    ) internal returns (uint256) {
    require(_amountHBTC > 0 || _amountWBTC > 0, "nothing to deposit");
    if (_amountHBTC > 0) {
      IERC20(hbtc).safeTransferFrom(msg.sender, address(this), _amountHBTC);
      // !!! following command fails with HBTC - try solidity update and safeIncreaseAllowance?
      //IERC20(hbtc).safeApprove(curve, 0);
      IERC20(hbtc).safeApprove(curve, _amountHBTC);
    }
    if (_amountWBTC > 0) {
      IERC20(wbtc).safeTransferFrom(msg.sender, address(this), _amountWBTC);
      IERC20(wbtc).safeApprove(curve, 0);
      IERC20(wbtc).safeApprove(curve, _amountWBTC);
    }
   
    uint256 minimum = 0;

    ICurveHBTC(curve).add_liquidity([_amountHBTC, _amountWBTC], minimum);
    
    uint256 received = IERC20(underlying).balanceOf(address(this));
    require(received > 0, "nothing received from curve");

    emit DepositCurve(_amountHBTC, _amountWBTC, received);
    return received;
  }
}