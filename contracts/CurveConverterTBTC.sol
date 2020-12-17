pragma solidity 0.5.16;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/math/Math.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";
import "./interfaces/ICurveTBTC.sol";
import "./interfaces/IVault.sol";



contract CurveConverterTBTC {
  using Address for address;
  using SafeMath for uint256;
  using SafeERC20 for IERC20;
  
  // hCRV
  address public underlying;
  address public curve;
  address public tbtc;
  address public renbtc;
  address public wbtc;
  address public sbtc;
  address public vault;

  event DepositVault(uint256 amount);
  event DepositCurve(uint256 _amountTBTC, uint256 _amountRenBTC, uint256 _amountWBTC, uint256 _amountSBTC, uint256 underlyingBalance);

  constructor(
    address _vault,
    address _underlying,
    address _curve,
    address _tbtc,
    address _renbtc,
    address _wbtc,
    address _sbtc
  )
  public {
    require(IVault(_vault).underlying() == _underlying, "vault does not support fCRV-TBTC");
    vault = _vault;
    underlying = _underlying;
    curve = _curve;
    tbtc = _tbtc;
    renbtc = _renbtc;
    wbtc = _wbtc;
    sbtc = _sbtc;
  }
  /**
  * Deposit CRV-TBTC to Harvest Vault.
  */
  function depositVault(uint256 amount) internal {
    IERC20(underlying).safeApprove(vault, 0);
    IERC20(underlying).safeApprove(vault, amount);
  
    emit DepositVault(amount);
    
    IVault(vault).depositFor(amount, msg.sender);
   }

  /**
  * Deposit tbtc,renbtc,sbtc, wbtc, convert to the CRV-TBTC tokens and deposit them to the Harvest Vault.
  */
  function depositAll(uint256 amountTBTC, uint256 amountRenBTC, uint256 amountWBTC, uint256 amountSBTC) public {

    uint256 amountUnderlying = depositCurvePool(amountTBTC, amountRenBTC, amountWBTC, amountSBTC);

    depositVault(amountUnderlying);
  }

  /**
  * Uses the Curve protocol to convert the underlying assets into the mixed token.
  */
  function depositCurvePool(
    uint256 _amountTBTC,
    uint256 _amountRenBTC, 
    uint256 _amountWBTC,
    uint256 _amountSBTC
    ) internal returns (uint256) {
    require(
      _amountTBTC > 0 || _amountRenBTC > 0 || _amountWBTC > 0 || _amountSBTC > 0,
     "nothing to deposit"
     );
    if (_amountTBTC > 0) {
      IERC20(tbtc).safeTransferFrom(msg.sender, address(this), _amountTBTC);
      IERC20(tbtc).safeApprove(curve, 0);
      IERC20(tbtc).safeApprove(curve, _amountTBTC);
    }
    if (_amountRenBTC > 0) {
      IERC20(renbtc).safeTransferFrom(msg.sender, address(this), _amountRenBTC);
      IERC20(renbtc).safeApprove(curve, 0);
      IERC20(renbtc).safeApprove(curve, _amountRenBTC);
    }
    if (_amountWBTC > 0) {
      IERC20(wbtc).safeTransferFrom(msg.sender, address(this), _amountWBTC);
      IERC20(wbtc).safeApprove(curve, 0);
      IERC20(wbtc).safeApprove(curve, _amountWBTC);
    }
    if (_amountSBTC > 0) {
      IERC20(sbtc).safeTransferFrom(msg.sender, address(this), _amountSBTC);
      IERC20(sbtc).safeApprove(curve, 0);
      IERC20(sbtc).safeApprove(curve, _amountSBTC);
    }
   
    uint256 minimum = 0;

    ICurveTBTC(curve).add_liquidity([_amountTBTC, _amountRenBTC, _amountWBTC, _amountSBTC], minimum);
    
    uint256 received = IERC20(underlying).balanceOf(address(this));
    require(received > 0, "nothing received from curve");

    emit DepositCurve(_amountTBTC, _amountRenBTC, _amountWBTC, _amountSBTC, received);
    return received;
  }
}