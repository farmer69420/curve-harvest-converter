pragma solidity 0.5.16;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/math/Math.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";
import "./interfaces/ICurveHUSDDeposit.sol";
import "./interfaces/ICurveConverter.sol";
import "./interfaces/IVault.sol";



contract CurveConverterHUSD is ICurveConverter {
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

  /**
  * Coins index used in Curve Deposit
  * 0: HUSD
  * 1: DAI
  * 2: USDC
  * 3: USDT
   */
  enum TokenIndex { HUSD, DAI, USDC, USDT }
  uint constant N_COINS = 4;

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
      
    IVault(vault).depositFor(amount, msg.sender);
   }

  /**
  * Deposit DAI, USDC and USDT, convert to the 3CRV tokens and deposit them to the Harvest Vault.
  */
  function depositAll(uint256[] calldata amount, uint256 minimum) external {
   
    // we need to convert to static array
    uint256[N_COINS] memory _amount;
    for (uint i = 0; i < N_COINS; i++ ) {
      _amount[i] = amount[i]; 
    }

    uint256 amountUnderlying = depositCurve(_amount, minimum);

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
  function depositCurve(
    uint256[N_COINS] memory _amount,
    uint256 _minimum
    ) internal returns (uint256) {

    prepareTransfer(IERC20(husd), _amount[uint(TokenIndex.HUSD)]);
    prepareTransfer(IERC20(dai), _amount[uint(TokenIndex.DAI)]);
    prepareTransfer(IERC20(usdc), _amount[uint(TokenIndex.USDC)]);
    prepareTransfer(IERC20(usdt), _amount[uint(TokenIndex.USDT)]);

    ICurveHUSDDeposit(curve).add_liquidity( _amount, _minimum);
    
    uint256 received = IERC20(underlying).balanceOf(address(this));
    require(received > 0, "amount received from curve is less than minimum");

    return received;
  }
}