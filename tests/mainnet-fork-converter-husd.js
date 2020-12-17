// This test is only invoked if MAINNET_FORK is set
if (process.env.MAINNET_FORK) {
    const Utils = require("./Utils.js");
    const MFC = require("./mainnet-fork-test-config.js");
    const { send } = require("@openzeppelin/test-helpers");
    const BigNumber = require("bignumber.js");
    //const Controller = artifacts.require("Controller");
    //const Storage = artifacts.require("Storage");
    const CurveConverterHUSD = artifacts.require("CurveConverterHUSD");
    const IERC20 = artifacts.require("IERC20");
    //const makeVault = require("./make-vault.js");
  
    BigNumber.config({ DECIMAL_PLACES: 8 });
  
    contract("Mainnet Curve Converter HUSD", function (accounts) {
      describe(`Curve HUSD + 3POOL`, function () {
        // external contracts
        let underlying;
        let dai;
        let usdc;
        let usdt;
  
        // external setup
        //let underlyingWhale = MFC.THREE_POOL_WHALE_ADDRESS;
        let daiWhale = MFC.DAI_WHALE_ADDRESS;
        let usdcWhale = MFC.USDC_WHALE_ADDRESS;
        let usdtWhale = MFC.USDT_WHALE_ADDRESS;
        let husdWhale = MFC.HUSD_WHALE_ADDRESS;

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
          underlying = await IERC20.at(MFC.HUSD_MIXED_ADDRESS);
          vault = await IERC20.at(MFC.HUSD_VAULT_ADDRESS);
          dai = await IERC20.at(MFC.DAI_ADDRESS);
          usdc = await IERC20.at(MFC.USDC_ADDRESS);
          usdt = await IERC20.at(MFC.USDT_ADDRESS);
          husd = await IERC20.at(MFC.HUSD_ADDRESS);
        }

        async function setupCoreProtocol() {
          converterHUSD = await CurveConverterHUSD.new(
            vault.address,
            underlying.address,
            MFC.HUSD_DEPOSIT_ADDRESS,
            dai.address,
            usdc.address,
            usdt.address,
            husd.address
            );
        }

        async function setupBalance(){
          // Give whale some ether to make sure the following actions are good
          await send.ether(etherGiver, daiWhale, "1" + "000000000000000000");
          await send.ether(etherGiver, usdcWhale, "1" + "000000000000000000");
          await send.ether(etherGiver, usdtWhale, "1" + "000000000000000000");
          await send.ether(etherGiver, husdWhale, "1" + "000000000000000000");
          daiBalance = await dai.balanceOf(daiWhale);
          usdcBalance = await usdc.balanceOf(usdcWhale);
          usdtBalance = await usdt.balanceOf(usdtWhale);
          husdBalance = await husd.balanceOf(husdWhale);
  
          await dai.transfer(farmer1, daiBalance, { from: daiWhale });
          await usdc.transfer(farmer1, usdcBalance, { from: usdcWhale });
          await usdt.transfer(farmer1, usdtBalance, { from: usdtWhale });
          await husd.transfer(farmer1, husdBalance, { from: husdWhale });
        }

        beforeEach(async function () {
            await setupExternalContracts();
            await setupCoreProtocol();
            await setupBalance();
          });
    

        it("A farmer depositing DAI", async function () {
          let farmerOldBalance = new BigNumber(await vault.balanceOf(farmer1));
          let daiBalance = new BigNumber(Math.floor(await dai.balanceOf(farmer1) / 2));
          console.log("deposit DAI: "+daiBalance)
        
          await dai.approve(converterHUSD.address, daiBalance, { from: farmer1 });
          await converterHUSD.depositAll([0, daiBalance, 0, 0], 0, { from: farmer1 });    
          
          let farmerNewBalance = new BigNumber(await vault.balanceOf(farmer1));
          console.log("farmer fCRV-HUSD Balance: " + farmerNewBalance)
          Utils.assertBNGt(farmerNewBalance, farmerOldBalance);
        });

        it("A farmer depositing USDC", async function () {
          let farmerOldBalance = new BigNumber(await vault.balanceOf(farmer1));
          let usdcBalance = new BigNumber(Math.floor(await usdc.balanceOf(farmer1) / 2));
          console.log("deposit USDC: "+usdcBalance)
        
          await usdc.approve(converterHUSD.address, usdcBalance, { from: farmer1 });
          await converterHUSD.depositAll([0, 0, usdcBalance, 0], 0, { from: farmer1 });    
          
          let farmerNewBalance = new BigNumber(await vault.balanceOf(farmer1));
          console.log("farmer fCRV-HUSD Balance: " + farmerNewBalance)
          Utils.assertBNGt(farmerNewBalance, farmerOldBalance);
        });

        it("A farmer depositing USDT", async function () {
          let farmerOldBalance = new BigNumber(await vault.balanceOf(farmer1));
          let usdtBalance = new BigNumber(Math.floor(await usdt.balanceOf(farmer1) / 2));
          console.log("deposit USDT: "+usdtBalance)
        
          await usdt.approve(converterHUSD.address, usdtBalance, { from: farmer1 });
          await converterHUSD.depositAll([0, 0, 0, usdtBalance], 0, { from: farmer1 });    
          
          let farmerNewBalance = new BigNumber(await vault.balanceOf(farmer1));
          console.log("farmer fCRV-HUSD Balance: " + farmerNewBalance)
          Utils.assertBNGt(farmerNewBalance, farmerOldBalance);
        });
        it("A farmer depositing HUSD", async function () {
          let farmerOldBalance = new BigNumber(await vault.balanceOf(farmer1));
          let husdBalance = new BigNumber(Math.floor(await husd.balanceOf(farmer1) / 2));
          console.log("deposit HUSD: "+usdtBalance)
        
          await husd.approve(converterHUSD.address, husdBalance, { from: farmer1 });
          await converterHUSD.depositAll([husdBalance, 0, 0, 0], 0, { from: farmer1 });    
          
          let farmerNewBalance = new BigNumber(await vault.balanceOf(farmer1));
          console.log("farmer fCRV-HUSD Balance: " + farmerNewBalance)
          Utils.assertBNGt(farmerNewBalance, farmerOldBalance);
        });

        it("A farmer depositing DAI, USDC, USDT", async function () {
          let farmerOldBalance = new BigNumber(await vault.balanceOf(farmer1));
          let daiBalance = new BigNumber(Math.floor(await dai.balanceOf(farmer1) / 2));
          let usdcBalance = new BigNumber(Math.floor(await usdc.balanceOf(farmer1) / 2));
          let usdtBalance = new BigNumber(Math.floor(await usdt.balanceOf(farmer1) / 2));
          console.log("deposit DAI: "+daiBalance)
          console.log("deposit USDC: "+usdcBalance)
          console.log("deposit USDT: "+usdtBalance)
        
          await dai.approve(converterHUSD.address, daiBalance, { from: farmer1 });
          await usdc.approve(converterHUSD.address, usdcBalance, { from: farmer1 });
          await usdt.approve(converterHUSD.address, usdtBalance, { from: farmer1 });
          await converterHUSD.depositAll([0, daiBalance, usdcBalance, usdtBalance], 0, { from: farmer1 });    
          
          let farmerNewBalance = new BigNumber(await vault.balanceOf(farmer1));
          console.log("farmer fCRV-HUSD Balance: " + farmerNewBalance)
          Utils.assertBNGt(farmerNewBalance, farmerOldBalance);
        });
        it("A farmer depositing DAI, USDC, USDT, HUSD", async function () {
          let farmerOldBalance = new BigNumber(await vault.balanceOf(farmer1));
          let daiBalance = new BigNumber(Math.floor(await dai.balanceOf(farmer1) / 2));
          let usdcBalance = new BigNumber(Math.floor(await usdc.balanceOf(farmer1) / 2));
          let usdtBalance = new BigNumber(Math.floor(await usdt.balanceOf(farmer1) / 2));
          let husdBalance = new BigNumber(Math.floor(await husd.balanceOf(farmer1) / 2));
          console.log("deposit DAI: "+daiBalance)
          console.log("deposit USDC: "+usdcBalance)
          console.log("deposit USDT: "+usdtBalance)
          console.log("deposit HUSD: "+husdBalance)
        
          await dai.approve(converterHUSD.address, daiBalance, { from: farmer1 });
          await usdc.approve(converterHUSD.address, usdcBalance, { from: farmer1 });
          await usdt.approve(converterHUSD.address, usdtBalance, { from: farmer1 });
          await husd.approve(converterHUSD.address, husdBalance, { from: farmer1 });
          await converterHUSD.depositAll([husdBalance, daiBalance, usdcBalance, usdtBalance], 0, { from: farmer1 });    
          
          let farmerNewBalance = new BigNumber(await vault.balanceOf(farmer1));
          console.log("farmer fCRV-HUSD Balance: " + farmerNewBalance)
          Utils.assertBNGt(farmerNewBalance, farmerOldBalance);
        });
        });
      });
    }
     