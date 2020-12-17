pragma solidity 0.5.16;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/math/Math.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";
import "./interfaces/ICurveTBTC.sol";
import "./interfaces/ICurveConverter.sol";
import "./interfaces/IVault.sol";



contract CurveConverterTBTC is ICurveConverter {
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
  
  /**
  * Coins index used in Curve Deposit
  * 0: tBTC
  * 1: renBTC
  * 2: wBTC
  * 3: sBTC
   */
  enum TokenIndex { TBTC, RENBTC, WBTC, SBTC }
  uint constant N_COINS = 4;

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
    
    IVault(vault).depositFor(amount, msg.sender);
   }

  /**
  * Deposit tbtc,renbtc,sbtc, wbtc, convert to the CRV-TBTC tokens and deposit them to the Harvest Vault.
  */
  function depositAll(uint256[] calldata amount, uint256 minimum) external {
   
    // we need to convert to static array
    uint256[N_COINS] memory _amount;
    for (uint i = 0; i < N_COINS; i++ ) {
      _amount[i] = amount[i]; 
    }

    uint256 amountUnderlying = depositCurvePool(_amount, minimum);

    depositVault(amountUnderlying);
  }

  /**
  * Transfer token from sender and approve it for spending by curve contract
  */
  function prepareTransfer(IERC20 token, uint256 amount) internal {
    if (amount > 0) {
      token.safeTransferFrom(msg.sender, address(this), amount);
      token.safeApprove(curve, 0);
      token.safeApprove(curve, amount);
    }
  }

  /**
  * Uses the Curve protocol to convert the underlying assets into the mixed token.
  */
  function depositCurvePool(
    uint256[N_COINS] memory _amount,
    uint256 _minimum
    ) internal returns (uint256) {

    prepareTransfer(IERC20(tbtc), _amount[uint(TokenIndex.TBTC)]);
    prepareTransfer(IERC20(renbtc), _amount[uint(TokenIndex.RENBTC)]);
    prepareTransfer(IERC20(wbtc), _amount[uint(TokenIndex.WBTC)]);
    prepareTransfer(IERC20(sbtc), _amount[uint(TokenIndex.SBTC)]);
   
    ICurveTBTC(curve).add_liquidity(_amount, _minimum);
    
    uint256 received = IERC20(underlying).balanceOf(address(this));
    require(received > 0, "amount received from curve is less than minimum");

    return received;
  }
}