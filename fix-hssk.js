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

function convert_error(err_arr,type){
	var error = [];
	if(type=='2number'){
		for(var j=0;j<err_arr.length;j++){
			switch (err_arr[j]){
				case 'Họ tên':
					error.push(0);
				break;
				case 'Ngày sinh':
					error.push(1);
				break;
				case 'Giới tính':
					error.push(2);
				break;
				case 'SĐT':
					error.push(3);
				break;
				case 'Số mũi tiêm':
					error.push(5);
				break;
			}
		}
		return error;
	}else{
		for(var i=0;i<err_arr.length;i++){
			switch (err_arr[i]){
				case 0:
					error.push('Họ tên');
				break;
				case 1:
					error.push('Ngày sinh');
				break;
				case 2:
					error.push('Giới tính');
				break;
				case 3:
					error.push('SĐT');
				break;
				case 5:
					error.push('Số mũi tiêm');
				break;
				case 9:
					error.push('EXCEL SAI TUỔI');
				break;
				case 8:
					error.push('EXCEL SAI SĐT');
				break;
				case 7:
					error.push('EXCEL SAI GIỚI TÍNH');
				break;
			}
		}
		return error;
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
		}
		else if(found[1] == '1'){
			let ten = $('table > tbody > tr > td:nth-child(2)').text().trim();
			let ngaysinh = $('table > tbody > tr > td:nth-child(3)').text().trim();
			let gioitinh = $('table > tbody > tr > td:nth-child(4)').text().trim();
			let sdt = $('table > tbody > tr > td:nth-child(5)').text().trim();
			let cmnd = $('table > tbody > tr > td:nth-child(8)').text().trim();
			let somuitiem = $('table > tbody > tr > td:nth-child(9)').text().trim();
			res.push(ten,ngaysinh,gioitinh,sdt,cmnd,somuitiem);
			let out = [res];
			return out;
		}
		else{
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

async function login(dt_arr,error){
	const csvWriter = createCsvWriter({
	  path: 'fix_out.csv',
	  append: true,
	  header: [
		{id: 'name', title: 'Tên'},
		{id: 'ngaysinh', title: 'Ngày sinh'},
		{id: 'gioitinh', title: 'Giới tính'},
		{id: 'sdt', title: 'Số điện thoại'},
		{id: 'cmnd', title: 'Chứng minh'},
		{id: 'muitiem', title: 'Số mũi tiêm'},
		{id: 'kq', title: 'Đã sửa'},
		{id: 'olddata', title: 'Dữ liệu cũ'},
	  ]
	});
	
	const width = 1224;
    const height = 786;
	const browser = await puppeteer.launch({args: args_launch, headless: true,'defaultViewport' : { 'width' : width, 'height' : height }});
	const page = await browser.newPage();
	await page.setViewport({ 'width' : width, 'height' : height });
	console.log("Loading trang đăng nhập...");
	await page.goto(loginUrl,{ waitUntil: 'networkidle2' });
	await page.waitForSelector('body > app-root > app-login > div > div.in-top-box > div > form > button',{visible: true, timeout :0});
	console.log("Đang đăng nhập!");
	await page.type('input[formcontrolname="username"]', '#YOUR_ACCOUNT',{ delay: 10 });
	await page.type('input[formcontrolname="password"]', '#YOUR_PASSWORD',{ delay: 10 });
	await page.click('body > app-root > app-login > div > div.in-top-box > div > form > button');
    await page.waitForNavigation(); 
	console.log("Đăng nhập thành công! Vào việc...");
	 //--------------------------------------------------------------------//	
	await page.goto("https://hssk.kcb.vn/#/tiem-chung-covid/danh-sach-benh-nhan-tiem",{waitUntil: 'networkidle2'});
	//Click seach advanced;	
	await delay(2000);
	//search input 
	//var data = 'Nguyễn Hùng,24/05/1964,Nam,0899238949,201092067,1,"SAI: Ngày sinh,SĐT"';
	//var dt_arr = data.split(";")
	const data_writer = [];
	for(var i=0;i<dt_arr.length;i++){
		//Mo lai khung search
		try{
			await page.waitForSelector('button[data-target="#demo"]',{visible: true,timeout:5000});
			var text_timkiem = await page.evaluate(()=>{
				return $('button[data-target="#demo"]').text().trim();
			});
			//console.log("text_timkiem="+text_timkiem);
			var regE = new RegExp("Ẩn tìm kiếm nâng cao");
			//console.log("Ẩn ="+regE.test(text_timkiem));
			if(!regE.test(text_timkiem)){
				await page.evaluate(()=>{
					$('button[data-target="#demo"]').get(0).click();
				});
			}
			
		}
		catch{
			console.log("sau 5s tự chuyển trang");
			await page.goto("https://hssk.kcb.vn/#/tiem-chung-covid/danh-sach-benh-nhan-tiem",{waitUntil: 'networkidle2'});
		}
		
		
		await delay(1000);
		try{
			await page.evaluate(()=>{
				$('.ng-value-icon.left.ng-star-inserted').get(0).click();
			});
		
		}
		catch(ex){
			//
		}
	try{
		//Go tim kiem
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
		await page.waitForSelector('div.overlay ',{hidden:true});
		}
		catch(ex){
			console.log("Lỗi: "+ex.toString());
		}
		await delay(1500);
		
		//kiem tra xem co bao nhieu dòng
		var xkq = await check_kq(page);
		if(xkq){
			if(xkq.length > 1){
				console.log("Có hơn 1 dòng dữ liệu trả về --> lấy theo số mũi tiêm cao hơn");
				var rows_arr = [];
				var index_arr = [];
				//Loc cac rows co Ten + CMND trung voi tim kiem -> dua vao rows_arr
				var maxItem = 0;
				var maxIndex = null;
				for(var j=0;j<xkq.length;j++){
					if(dt_arr[i][0].toLowerCase() == xkq[j][0].toLowerCase() && dt_arr[i][4].toLowerCase() == xkq[j][4].toLowerCase() ){
						//tim mui tiem cao nhat
						if (parseInt(xkq[j][5]) > maxItem) {
							maxItem = parseInt(xkq[j][5]);
							maxIndex = j;
						}
					}
				}
				console.log("SỐ MŨI CAO NHẤT:  "+ maxItem);
				console.log("Dòng dữ liệu đúng:  "+ (maxIndex+1));
				
				//sửa
				console.log("Dữ liệu cần sửa: ");
				await page.evaluate(selector => {
					const scrollableSection = document.querySelector(selector);
					scrollableSection.scrollTop = scrollableSection.offsetHeight;
				}, 'table > tbody > tr > td:nth-child(10) > div > span:nth-child(4) > button');
				//Click cho đúng dòng cần sửa nếu có nhiều mũi tiêm
				if(maxIndex){
					await page.click('table > tbody > tr:nth-child('+(maxIndex+1)+') > td:nth-child(10) > div > span:nth-child(4) > button');
					await page.waitForSelector('div.row button:nth-child(1)',{timeout :0});
					
					//Khai bao cac muc can sua
					var nameFix_Input = await page.$('input[formcontrolname="fullName"]');
					var birthFix_Input = await page.$('input[placeholder="dd/mm/yyyy"]');
					//let sexFix_Input = await page.$('');
					var phoneFix_Input = await page.$('input[formcontrolname="phoneNumber"]');
					var old_data = [];
					for(var er=0;er<error[i].length;er++){
					switch (error[i][er]) {
						case 0:{
							//Luu du lieu cu
							let od = await page.evaluate(()=>{
								return $('input[formcontrolname="fullName"]').val();
							});
							
							if(od.toLowerCase() == dt_arr[i][0].toLowerCase()){
								// ko sửa
							}
							else{
								old_data.push(od);
								await nameFix_Input.focus();
								await page.keyboard.down('Control');
								await page.keyboard.press('A');
								await page.keyboard.up('Control');
								await page.keyboard.press('Backspace');
								await nameFix_Input.type(dt_arr[i][0],{ delay: 10 });
								console.log("- Họ tên: "+od+" => "+dt_arr[i][0]);
							}
							
						}
						break;
						case 1:{
							//Luu du lieu cu
							let od = await page.evaluate(()=>{
								return $('input[placeholder="dd/mm/yyyy"]').val();
							});
							
							var user_old = dt_arr[i][1].split('/');
							var year_old = 2021 - parseInt(user_old[2]);
							if(od.toLowerCase() == dt_arr[i][1].toLowerCase()){
								// ko sửa
							}else if(year_old < 17 ){
								console.log("- EXCEL SAI NGAY SINH");
								error[i].push(9);
							}
							else{
								old_data.push(od);
								await birthFix_Input.focus();
								await page.keyboard.down('Control');
								await page.keyboard.press('A');
								await page.keyboard.up('Control');
								await page.keyboard.press('Backspace');
								await birthFix_Input.type(dt_arr[i][1],{ delay: 10 });
								console.log("- Ngày sinh: "+od+" => "+dt_arr[i][1]);
							}
							
						}
						break;
						case 2:{
							//Luu du lieu cu
							let od = await page.evaluate(()=>{
								return $('input[formcontrolname="genderId"]:checked').parent().text().trim()
							});
							
							var reg = new RegExp("thị");
							if(od.toLowerCase() == dt_arr[i][2].toLowerCase()){
								// ko sửa
							}else if(reg.test(dt_arr[i][0].toLowerCase()) && dt_arr[i][2].toLowerCase() == 'nam' ){
								console.log("- EXCEL SAI GIỚI TÍNH");
								error[i].push(7);
							}
							else{
								old_data.push(od);
								await page.waitForSelector('input[formcontrolname="genderId"]:checked');
								console.log(dt_arr[i][2].toLowerCase());
								await page.evaluate((dt_arrx)=>{
									$('input[formcontrolname="genderId"]').each(function (){
										if($(this).parent().text().trim().toLowerCase() == dt_arrx.trim().toLowerCase()){
											$(this).prop('checked',true);
										}
									});
								},dt_arr[i][2]);
								console.log("- Giới tính: "+od+" => "+dt_arr[i][2]);
							}
							
						}
						break;
						case 3:{
							
							//Luu du lieu cu
							var od = await page.evaluate(()=>{
								return $('input[formcontrolname="phoneNumber"]').val();
							});
							var phonelen = dt_arr[i][3].length;
							if(od.toLowerCase() == dt_arr[i][3].toLowerCase()){
								// ko sửa
							}
							else if(phonelen != 10){
								console.log("- EXCEL SAI SĐT");
								error[i].push(8);
							}
							else{
								old_data.push(od);
								await phoneFix_Input.focus();
								await page.keyboard.down('Control');
								await page.keyboard.press('A');
								await page.keyboard.up('Control');
								await page.keyboard.press('Backspace');
								await phoneFix_Input.type(dt_arr[i][3],{ delay: 10 });
								console.log("- SĐT: "+od+" => "+dt_arr[i][3]);
							}
							
						}
					}
				}
				
				}
				else{
					console.log("TÌM KO RA DÒNG CẦN SỬA. TỰ SỬA ĐI");
				}
				
			}
			else{
				//sửa
				//Click nut sửa
				console.log("Sửa dữ liệu: ");
				await page.evaluate(selector => {
					const scrollableSection = document.querySelector(selector);
					scrollableSection.scrollTop = scrollableSection.offsetHeight;
				}, 'table > tbody > tr > td:nth-child(10) > div > span:nth-child(4) > button');
				await page.evaluate(()=>{
					 $('table > tbody > tr > td:nth-child(10) > div > span:nth-child(4) > button').click();
				});
				await page.waitForSelector('div.row button:nth-child(1)',{timeout :0});
				
				//Khai bao cac muc can sua
				var nameFix_Input  = await page.$('input[formcontrolname="fullName"]');
				var birthFix_Input = await page.$('input[placeholder="dd/mm/yyyy"]');
				//let sexFix_Input = await page.$('input[formcontrolname="genderId"]');
				var phoneFix_Input = await page.$('input[formcontrolname="phoneNumber"]');
				var old_data = [];
				
				for(var er=0;er<error[i].length;er++){
					switch (error[i][er]) {
						case 0:{
							//Luu du lieu cu
							let od = await page.evaluate(()=>{
								return $('input[formcontrolname="fullName"]').val();
							});
							
							if(od.toLowerCase() == dt_arr[i][0].toLowerCase()){
								// ko sửa
							}
							else{
								old_data.push(od);
								await nameFix_Input.focus();
								await page.keyboard.down('Control');
								await page.keyboard.press('A');
								await page.keyboard.up('Control');
								await page.keyboard.press('Backspace');
								await nameFix_Input.type(dt_arr[i][0],{ delay: 10 });
								console.log("- Họ tên: "+od+" => "+dt_arr[i][0]);
							}
							
						}
						break;
						case 1:{
							//Luu du lieu cu
							let od = await page.evaluate(()=>{
								return $('input[placeholder="dd/mm/yyyy"]').val();
							});
							
							var user_old = dt_arr[i][1].split('/');
							var year_old = 2021 - parseInt(user_old[2]);
							if(od.toLowerCase() == dt_arr[i][1].toLowerCase()){
								// ko sửa
							}else if(year_old < 17 ){
								console.log("- EXCEL SAI NGAY SINH");
								error[i].push(9);
							}
							else{
								old_data.push(od);
								await birthFix_Input.focus();
								await page.keyboard.down('Control');
								await page.keyboard.press('A');
								await page.keyboard.up('Control');
								await page.keyboard.press('Backspace');
								await birthFix_Input.type(dt_arr[i][1],{ delay: 10 });
								console.log("- Ngày sinh: "+od+" => "+dt_arr[i][1]);
							}
							
						}
						break;
						case 2:{
							//Luu du lieu cu
							let od = await page.evaluate(()=>{
								return $('input[formcontrolname="genderId"]:checked').parent().text().trim()
							});
							
							var reg = new RegExp("thị");
							if(od.toLowerCase() == dt_arr[i][2].toLowerCase()){
								// ko sửa
							}else if(reg.test(dt_arr[i][0].toLowerCase()) && dt_arr[i][2].toLowerCase() == 'nam' ){
								console.log("- EXCEL SAI GIỚI TÍNH");
								error[i].push(7);
							}
							else{
								old_data.push(od);
								await page.waitForSelector('input[formcontrolname="genderId"]:checked');
								console.log(dt_arr[i][2].toLowerCase());
								await page.evaluate((dt_arrx)=>{
									$('input[formcontrolname="genderId"]').each(function (){
										if($(this).parent().text().trim().toLowerCase() == dt_arrx.trim().toLowerCase()){
											$(this).prop('checked',true);
										}
									});
								},dt_arr[i][2]);
								console.log("- Giới tính: "+od+" => "+dt_arr[i][2]);
							}
							
						}
						break;
						case 3:{
							
							//Luu du lieu cu
							var od = await page.evaluate(()=>{
								return $('input[formcontrolname="phoneNumber"]').val();
							});
							var phonelen = dt_arr[i][3].length;
							if(od.toLowerCase() == dt_arr[i][3].toLowerCase()){
								// ko sửa
							}
							else if(phonelen != 10){
								console.log("- EXCEL SAI SĐT");
								error[i].push(8);
							}
							else{
								old_data.push(od);
								await phoneFix_Input.focus();
								await page.keyboard.down('Control');
								await page.keyboard.press('A');
								await page.keyboard.up('Control');
								await page.keyboard.press('Backspace');
								await phoneFix_Input.type(dt_arr[i][3],{ delay: 10 });
								console.log("- SĐT: "+od+" => "+dt_arr[i][3]);
							}
							
						}
					}
				}
			}

			//await delay (10000);
			var ez = convert_error(error[i]);
			//Bam nut Luu
			var disabled = await page.evaluate(()=>{
				var dis = $('div.row button:nth-child(1)').attr("disabled");
				if(dis == 'disabled'){
					return Promise.resolve(true);
				}
				return Promise.resolve(false);
			});
			//console.log(disabled);
			if(!disabled){
				//await page.click('div.row button:nth-child(1)');
				await page.evaluate(()=>{
					$('div.row button:nth-child(1)').click();
				});
			}
			else{
				var log = await page.evaluate(()=>{
					$('div.row button:nth-child(1)').prop("disabled", false);
					return $('div.row button:nth-child(1)').is(':disabled');
				});
				//console.log(log);
				await page.evaluate(()=>{
					$('div.row button:nth-child(1)').click();
				});
				//console.log("click Luu");
			}
			
			try{
				await page.waitForSelector('div[role="alertdialog"]');
				var fix_response = await page.evaluate(()=>{
					return $('div[role="alertdialog"]').text();
				});
				console.log("Kết quả:");
				console.log("->"+fix_response);
				var timkiem = new RegExp("Đã tồn tại");
				if(timkiem.test(fix_response)){
					ez =['KHÔNG THÀNH CÔNG',fix_response.trim()];
					await page.goto("https://hssk.kcb.vn/#/tiem-chung-covid/danh-sach-benh-nhan-tiem",{waitUntil: 'networkidle2'});
				}
			}catch (ex){
				//
			}
			
			
			let wt = [
			{
				name: dt_arr[i][0],
				ngaysinh: dt_arr[i][1],
				gioitinh: dt_arr[i][2],
				sdt: dt_arr[i][3],
				cmnd: dt_arr[i][4],
				muitiem: dt_arr[i][5],
				kq: 'Sửa: '+ez.toString(),
				olddata: old_data.toString()
			}];
			await csvWriter.writeRecords(wt);
			await delay(500);
		}
		else{
			console.log('Tìm không ra - dữ liệu đã bị xoá !');
		}
	}
	
}

try{
	//test();
	
	var data = 'Đặng Thị B,18/01/1964,Nữ,0987654321,123456789,2,SAI: SĐT,Số mũi tiêm\nĐặng C,27/09/1981,Nam,123456789,123456789,1,SAI: Ngày sinh\nNguyễn Thị D,17/01/1956,Nữ,0900000000,123456789,1,SAI: Ngày sinh';
	
	var rows = data.split("\n");
	var row_arr =[];
	var data_list = [];
	var err_list = [];
	rows.forEach(function (row) {
		var rowa = row.split("SAI: ");
		
		data_list.push(rowa[0].split(","));
		let erz = rowa[1].replace(/"/g, '');
		erz = erz.split(",");
		let error = convert_error(erz,'2number');
		err_list.push(error);
		
	});
	login(data_list,err_list);

	
}
catch(error){
	console.log(error);
}

