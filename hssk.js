'use strict';
const puppeteer = require('puppeteer');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const parse  = require('csv-parser');
const fs = require('fs');

// https://developers.whatismybrowser.com/useragents/explore/software_name/chrome/
var ua = "Mozilla/5.0 (Windows NT 10.0; WOW64; rv:51.0) Gecko/20100101 Firefox/51.0";
//hackernoon.com/tips-and-tricks-for-web-scraping-with-puppeteer-ed391a63d952 -> fast 
const args_launch = [
					  '--no-sandbox',
					  '--disable-setuid-sandbox',
					  '--disable-dev-shm-usage',
					  '--disable-accelerated-2d-canvas',
					  '--disable-gpu',
					  '--window-size=1920x1080',
					  '--disable-web-security',
					  '--user-agent='+ua,
					  '--disable-web-security',
					  
				  ]

const loginUrl = "https://hssk.kcb.vn/#/sessions/login";
function isEqual(a,b){
  // if length is not equal
  if(a.length!=b.length)
   return a = ['length is not equal'];
  else
  {
	var error = [];
	for(var i=0;i<a.length;i++){
		if(a[i].toLowerCase()!=b[i].toLowerCase()){
		   error.push(i);
		}
	}
	if(error.length === 0){
		return true;
	}else{
		for(var i=0;i<error.length;i++){
			switch (error[i]){
				case 0:
					error[i] = 'Họ tên';
				break;
				case 1:
					error[i] = 'Ngày sinh';
				break;
				case 2:
					error[i] = 'Giới tính';
				break;
				case 3:
					error[i] = 'SĐT';
				break;
				case 5:
					error[i] = 'Số mũi tiêm';
				break;
			}
		}
		return error;
	}
    
  }
}
function isEmpty(obj) {
    for(var key in obj) {
        if(obj.hasOwnProperty(key))
            return false;
    }
    return true;
}

function delay (ms){
	return new Promise(resolve => setTimeout(resolve, ms));
} 
process.on('unhandledRejection', (reason, p) => {
	console.log('>>>Unhandled Rejection at:', p, 'reason:', reason);
	// application specific logging, throwing an error, or other logic here
});

async function check_kq(page){
	var xkq = await page.evaluate(()=>{
		let num = $('div.title-form-input-list').text();
		let found = num.match(/\d+/g);
		var res = [];
		if(found[1] == '0'){
			return null;
		}else if(found[1] == '1'){
			let ten = $('table > tbody > tr > td:nth-child(2)').text().trim();
			let ngaysinh = $('table > tbody > tr > td:nth-child(3)').text().trim();
			let gioitinh = $('table > tbody > tr > td:nth-child(4)').text().trim();
			let sdt = $('table > tbody > tr > td:nth-child(5)').text().trim();
			let cmnd = $('table > tbody > tr > td:nth-child(8)').text().trim();
			let somuitiem = $('table > tbody > tr > td:nth-child(9)').text().trim();
			res.push(ten,ngaysinh,gioitinh,sdt,cmnd,somuitiem);
			let out = [res];
			return out;
		}else{
			var out = [];
			for(var i=1;i<= parseInt(found[1]) ;i++){
				let ires =[];
				let ten = $('table > tbody > tr:nth-child('+i+') > td:nth-child(2)').text().trim();
				let ngaysinh = $('table > tbody > tr:nth-child('+i+') > td:nth-child(3)').text().trim();
				let gioitinh = $('table > tbody > tr:nth-child('+i+') > td:nth-child(4)').text().trim();
				let sdt = $('table > tbody > tr:nth-child('+i+') > td:nth-child(5)').text().trim();
				let cmnd = $('table > tbody > tr:nth-child('+i+') > td:nth-child(8)').text().trim();
				let somuitiem = $('table > tbody > tr:nth-child('+i+') > td:nth-child(9)').text().trim();
				ires.push(ten,ngaysinh,gioitinh,sdt,cmnd,somuitiem);
				out.push(ires);
			}
			return out;
		}
	});
	return xkq;
}

async function login(data){
	const csvWriter = createCsvWriter({
	  path: 'out.csv',
	  append: true,
	  header: [
		{id: 'name', title: 'Tên'},
		{id: 'ngaysinh', title: 'Ngày sinh'},
		{id: 'gioitinh', title: 'Giới tính'},
		{id: 'sdt', title: 'Số điện thoại'},
		{id: 'cmnd', title: 'Chứng minh'},
		{id: 'muitiem', title: 'Số mũi tiêm'},
		{id: 'kq', title: 'Kết quả Tra cứu'},
	  ]
	});
	const browser = await puppeteer.launch({args: args_launch, headless: false,'defaultViewport' : { 'width' : 1366, 'height' : 768 }});
	const page = await browser.newPage();
	
	await page.goto(loginUrl,{ waitUntil: 'networkidle2' });
	//await page.waitForSelector('.form-item input[type=submit]',{visible: true, timeout :0});
	console.log("Đang đăng nhập!");
	await page.type('input[formcontrolname="username"]', '#YOUR_ACCOUTNT',{ delay: 10 });
	await page.type('input[formcontrolname="password"]', '#YOUR_PASSWORD',{ delay: 10 });
	await page.click('body > app-root > app-login > div > div.in-top-box > div > form > button')
    await page.waitForNavigation(); 
	console.log("Đăng nhập thành công! Vào việc...");
	 //--------------------------------------------------------------------//	
	await page.goto("https://hssk.kcb.vn/#/tiem-chung-covid/danh-sach-benh-nhan-tiem",{waitUntil: 'networkidle2'});
	//Click seach advanced;	
	await delay(2000);
	await page.evaluate(()=>{
			$('button[data-target="#demo"]').get(0).click();
		});
	await delay(1000);
	await page.evaluate(()=>{
			$('.ng-value-icon.left.ng-star-inserted').get(0).click();
		});
	//search input 
	//var dt_arr = data.split(";")
	const data_writer = [];
	for(var i=0;i<dt_arr.length;i++){
		let nameInput = await page.$('input[formcontrolname="fullName"]');
		let cmndInput = await page.$('input[formcontrolname="identification"]');
		
		await page.focus('input[formcontrolname="fullName"]');
		await page.keyboard.down('Control');
		await page.keyboard.press('A');
		await page.keyboard.up('Control');
		await page.keyboard.press('Backspace');
		await nameInput.type(dt_arr[i][0],{ delay: 10 });
		
		await page.focus('input[formcontrolname="identification"]');
		await page.keyboard.down('Control');
		await page.keyboard.press('A');
		await page.keyboard.up('Control');
		await page.keyboard.press('Backspace');
		await cmndInput.type(dt_arr[i][4],{ delay: 10 });
		await delay(500);
		await page.click('button[type=submit]');
		//await page.waitForNavigation({ waitUntil: "networkidle0" });
		console.log("Tìm kiếm ...");
		await delay(1500);
		
		//kiem tra xem co bao nhieu dòng
		var xkq = await check_kq(page);
		if(!xkq){
			console.log(dt_arr[i][0]+" - CMND: "+dt_arr[i][4]+" --> Không có dữ liệu");
			let wt = [{
				name: dt_arr[i][0],
				ngaysinh: dt_arr[i][1],
				gioitinh: dt_arr[i][2],
				sdt: dt_arr[i][3],
				cmnd: dt_arr[i][4],
				muitiem: dt_arr[i][5],
				kq: 'Không có dữ liệu'
			}];
			await csvWriter.writeRecords(wt);
		}else {
			console.log("-----------------------------------");
			console.log("KẾT QUẢ TÌM KIẾM: "+ xkq.length+ " KẾT QUẢ");
			//console.log(xkq);
			console.log("-----------------------------------");
			if(xkq.length > 1){
				console.log("Có hơn 1 dòng dữ liệu trả về --> lấy theo số mũi tiêm cao hơn");
				var rows_arr = [];
				//Loc cac rows co Ten + CMND trung voi tim kiem -> dua vao rows_arr
				for(var j=0;j<xkq.length;j++){
					if(dt_arr[i][0].toLowerCase() == xkq[j][0].toLowerCase() && dt_arr[i][4].toLowerCase() == xkq[j][4].toLowerCase() ){
						rows_arr.push(xkq[j]);
					}
				}
				console.log(rows_arr);
				// 
				var muitiem_arr = [];
				for(var j=0;j<rows_arr.length;j++){
					muitiem_arr.push(rows_arr[j][5]);
				}
				//console.log(muitiem_arr);
				console.log("SỐ MŨI CAO NHẤT: "+ Math.max(...muitiem_arr));
				var indexOfMax_MuiTiem = muitiem_arr.reduce((iMax, x, i, arr) => x > arr[iMax] ? i : iMax, 0);
				//console.log("indexOfMax_MuiTiem:"+indexOfMax_MuiTiem);
				var sosanh = isEqual(dt_arr[i],rows_arr[indexOfMax_MuiTiem]);
				if(sosanh == true){
					console.log(dt_arr[i][0]+" - CMND: "+dt_arr[i][4]+" --> Dữ liệu CHÍNH XÁC");
					let wt = [
					{
						name: dt_arr[i][0],
						ngaysinh: dt_arr[i][1],
						gioitinh: dt_arr[i][2],
						sdt: dt_arr[i][3],
						cmnd: dt_arr[i][4],
						muitiem: dt_arr[i][5],
						kq: 'Dữ liệu CHÍNH XÁC'
					}];
					await csvWriter.writeRecords(wt);
				}else{
					console.log(dt_arr[i][0]+" - CMND: "+dt_arr[i][4]+" --> SAI: "+sosanh);
					let wt =[
					{
						name: dt_arr[i][0],
						ngaysinh: dt_arr[i][1],
						gioitinh: dt_arr[i][2],
						sdt: dt_arr[i][3],
						cmnd: dt_arr[i][4],
						muitiem: dt_arr[i][5],
						kq: 'SAI: '+sosanh.toString()
					}];
					await csvWriter.writeRecords(wt);
				}
			}
			else{
				var sosanh= isEqual(dt_arr[i],xkq[0]);
				//console.log("dt_arr[i] = "+ dt_arr[i]);
				//console.log("xkq[0] = "+ xkq[0]);
				if(sosanh == true){
					console.log(dt_arr[i][0]+" - CMND: "+dt_arr[i][4]+" --> Dữ liệu CHÍNH XÁC");
					let wt = [
					{
						name: dt_arr[i][0],
						ngaysinh: dt_arr[i][1],
						gioitinh: dt_arr[i][2],
						sdt: dt_arr[i][3],
						cmnd: dt_arr[i][4],
						muitiem: dt_arr[i][5],
						kq: 'Dữ liệu CHÍNH XÁC'
					}];
					await csvWriter.writeRecords(wt);
				}else{
					console.log(dt_arr[i][0]+" - CMND: "+dt_arr[i][4]+" --> SAI: "+sosanh);
					let wt =[
					{
						name: dt_arr[i][0],
						ngaysinh: dt_arr[i][1],
						gioitinh: dt_arr[i][2],
						sdt: dt_arr[i][3],
						cmnd: dt_arr[i][4],
						muitiem: dt_arr[i][5],
						kq: 'SAI: '+sosanh.toString()
					}];
					await csvWriter.writeRecords(wt);
				}
			}
		}
		await delay(2000);
	}
	
	
	
}

try{
	//test();
	var data = "Nguyễn Thị A;15/09/2021;Nữ;0987654321;123456789;1\nBÙI QUANG D;31/11/1986;Nam;0987654321;123456789123;1"; // form Dữ liệu đầu vào
	var row_arr = data.split("\n");
	var dt_arr = [];
	row_arr.forEach(function (row) {
		let arr = row.split(";");
		dt_arr.push(arr);
	});
	//console.log(dt_arr);
	login(dt_arr);
	
	/*
	var csvData=[];
	fs.createReadStream('full_data.csv')
		.pipe(parse({delimiter: ';',columns: false,}))
		.on('headers', (headers) => {
			console.log(`First header: ${headers[0]}`)
		})
		.on('data', function(csvrow) {
			//console.log(csvrow);
			//do something with csvrow
			csvData.push(csvrow);        
		})
		.on('end',function() {
		  //do something with csvData
		  console.log(csvData);
		});
		
	*/
}
catch(error){
	console.log(error);
}

