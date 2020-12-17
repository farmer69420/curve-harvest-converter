// This test is only invoked if MAINNET_FORK is set
if (process.env.MAINNET_FORK) {
    const Utils = require("./Utils.js");
    const MFC = require("./mainnet-fork-test-config.js");
    const { send } = require("@openzeppelin/test-helpers");
    const BigNumber = require("bignumber.js");
    //const Controller = artifacts.require("Controller");
    //const Storage = artifacts.require("Storage");
    const CurveConverterHBTC = artifacts.require("CurveConverterHBTC");
    const IERC20 = artifacts.require("IERC20");
    //const makeVault = require("./make-vault.js");
  
    BigNumber.config({ DECIMAL_PLACES: 8 });
  
    contract("Mainnet Curve Converter HBTC", function (accounts) {
      describe(`Curve HBTC`, function () {
        // external contracts
        let underlying;
        let hbtc;
        let wbtc;
  
        // external setup
        let hbtcWhale = MFC.HBTC_WHALE_ADDRESS;
        let wbtcWhale = MFC.WBTC_WHALE_ADDRESS;


        // parties in the protocol
        let governance = accounts[1];
        let farmer1 = accounts[3];
  
        // numbers used in tests
        let farmerBalance;
  
        // only used for ether distribution
        let etherGiver = accounts[9];
  
        // Core protocol contracts
        let vault;
  
        async function setupExternalContracts() {
          underlying = await IERC20.at(MFC.HBTC_MIXED_ADDRESS);
          vault = await IERC20.at(MFC.HBTC_VAULT_ADDRESS);
          hbtc = await IERC20.at(MFC.HBTC_ADDRESS);
          wbtc = await IERC20.at(MFC.WBTC_ADDRESS);
        }

        async function setupCoreProtocol() {
          converterHBTC = await CurveConverterHBTC.new(
            vault.address,
            underlying.address,
            MFC.HBTC_DEPOSIT_ADDRESS,
            hbtc.address,
            wbtc.address
            );
        }

        async function setupBalance(){
          // Give whale some ether to make sure the following actions are good
          await send.ether(etherGiver, hbtcWhale, "1" + "000000000000000000");
          await send.ether(etherGiver, wbtcWhale, "1" + "000000000000000000");
          hbtcBalance = await hbtc.balanceOf(hbtcWhale);
          wbtcBalance = await wbtc.balanceOf(wbtcWhale);
  
          //HBTC fails when 0
          if (hbtcBalance > 0) {
            await hbtc.transfer(farmer1, hbtcBalance, { from: hbtcWhale });
          }
          await wbtc.transfer(farmer1, wbtcBalance, { from: wbtcWhale });
        }

        beforeEach(async function () {
            await setupExternalContracts();
            await setupCoreProtocol();
            await setupBalance();
          });
    
         
        it("A farmer depositing HBTC", async function () {
          let farmerOldBalance = new BigNumber(await vault.balanceOf(farmer1));
          let hbtcBalance = new BigNumber(Math.floor(await hbtc.balanceOf(farmer1) /2));
          console.log("deposit HBTC: "+hbtcBalance);
        
          await hbtc.approve(converterHBTC.address, hbtcBalance, { from: farmer1 });
          await converterHBTC.depositAll(hbtcBalance, 0, { from: farmer1 });    
          
          let farmerNewBalance = new BigNumber(await vault.balanceOf(farmer1));
          console.log("farmer fhCRV Balance: " + farmerNewBalance);
          Utils.assertBNGt(farmerNewBalance, farmerOldBalance);
        });
      
        it("A farmer depositing WBTC", async function () {
          let farmerOldBalance = new BigNumber(await vault.balanceOf(farmer1));
          let wbtcBalance = new BigNumber(Math.floor(await wbtc.balanceOf(farmer1) / 2));
          console.log("deposit WBTC: "+wbtcBalance)
        
          await wbtc.approve(converterHBTC.address, wbtcBalance, { from: farmer1 });
          await converterHBTC.depositAll(0, wbtcBalance, { from: farmer1 });    
          
          let farmerNewBalance = new BigNumber(await vault.balanceOf(farmer1));
          console.log("farmer fhCRV Balance: " + farmerNewBalance)
          Utils.assertBNGt(farmerNewBalance, farmerOldBalance);
        });
         
        it("A farmer depositing HBTC, WBTC", async function () {
          let farmerOldBalance = new BigNumber(await vault.balanceOf(farmer1));
          let hbtcBalance = new BigNumber(Math.floor(await hbtc.balanceOf(farmer1) / 2));
          let wbtcBalance = new BigNumber(Math.floor(await wbtc.balanceOf(farmer1) / 2));
          console.log("deposit HBTC: "+hbtcBalance);
          console.log("deposit WBTC: "+wbtcBalance);
        
          await hbtc.approve(converterHBTC.address, hbtcBalance, { from: farmer1 });
          await wbtc.approve(converterHBTC.address, wbtcBalance, { from: farmer1 });
          await converterHBTC.depositAll(hbtcBalance, wbtcBalance, { from: farmer1 });    
          
          let farmerNewBalance = new BigNumber(await vault.balanceOf(farmer1));
          console.log("farmer fhCRV Balance: " + farmerNewBalance)
          Utils.assertBNGt(farmerNewBalance, farmerOldBalance);
        });
        });
      });
    }
    