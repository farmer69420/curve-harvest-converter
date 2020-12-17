# Curve Token Converter 
smart contracts with basic function to provide liquidity on Curve and then deposit to Harvest vault

## Status

Created smart contracts with tests for all current Harvest Curve Vaults. It was done with intention for Harvest governance to deploy contracts. Contracts can be used on front page, or I can create or cooperate on web UI. Converter is using `Curve Deposit` SC in all cases where it exists, to prevent adding extra code. 

## Next steps
- add Harvest governance and defense related code
- web UI

## Known Issues 
- `HBTC` 

with HBTC `IERC20(hbtc).safeApprove(curve, 0);` fails with
```
Stacktrace:
Error: Revert (message: SafeERC20: low-level call failed)
  at SafeERC20.safeApprove [address 0xe2646325c7518a5Ff98EC45cA0957899FE891288] (@openzeppelin/contracts/token/ERC20/SafeERC20.sol:68:9)
```
Next step to try solidity update and `safeIncreaseAllowance`. 

- `RenBTC`  

even small transactions fail with `revert Too much arb -- Reason given: Too much arb.` 

## ganache
[ganache-cli commands used for tests](ganache-commands.md)

## Running tests 

first terminal
```
npx ganache-cli --fork https://mainnet.infura.io/v3/YOUR_TOKEN -u '0x317ae07510d655e3bd355d8612e8dc7c1538dcef' -u '0xaaf5959918b74a6cab04a18987ab73dd9567a8d1' -u '0x8cee3eeab46774c1CDe4F6368E3ae68BcCd760Bf' -u '0x7b00C6505266C837d8BA30BEfd25523f32D69885'
```
second terminal
```
export MAINNET_FORK=True && npx truffle test ./tests/mainnet-fork-converter-3crv.js
```
