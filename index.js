//const moment = require('moment')

const sql = require('mssql');

const config80 = {
	user: 'sa',
	password: 'sina.com.1',
	server: '192.168.100.80',
	database: 'MyWebFlow',
	options: {
		useUTC: false
	}
};

var pool80 = new sql.ConnectionPool(config80, err => {
	if (err)
		console.log(err);
})

pool80.on('error', err => {
	console.log(err);
})

const express = require('express');
const app = express();
const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.all('*', function(req, res, next) {
	    res.header("Access-Control-Allow-Origin", "*");
	    res.header("Access-Control-Allow-Headers", "Content-Type,Content-Length,Authorization,Accept,X-Requested-With");
	    res.header("Access-Control-Allow-Methods","PUT,POST,GET,DELETE,OPTIONS");
	    res.header("Content-Type", "application/json;charset=utf-8");
	    if(req.method==="OPTIONS") res.sendStatus(200);/*让options请求快速返回*/
		    else next();
});

var sql_getlist = "select Customer_dId [PEID],Customer_sName [姓名],Rtrim(Customer_sSex) [性别],Customer_sAge [年龄],convert(varchar,Customer_dCheckDate,23) [体检日期],Customer_sCard [签证号]";
sql_getlist += " from TB_CR_Customer where Customer_sCompany like '友邦保险%' and Customer_dCheckDate between @d0 and @d1";

app.get('/api/v1/list', function(req, res) {
	if (req.query['key'] !== '72fa4dff') {
		res.status(401).end();
		return;
	}
	let d0 = req.query['d0'] || '2010-01-01';
	let d1 = req.query['d1'] || '2029-12-31';
	let f = async function() {
		try {
			let result = await pool80.request()
				.input('d0', d0)
				.input('d1', d1)
				.query(sql_getlist);
			res.status(200).json({status:{code:0},data:result.recordset});
		} catch(err) {
			console.log(err);
			res.status(500).json(err);
		}
	};
	f();
});

var sql_getresult = "select b.CR_sRoomName [科室名称],b.CR_sCheckItem [项目编号],c.Item_sDesc [项目名称],c.Item_sValue [参考值],b.CR_sConcl [检查结果],b.CR_sDesc [异常描述],d.CR_sDegr [本科印象] "
sql_getresult += "from TB_CR_Customer a inner join tb_cr_detail b on a.Customer_dId = b.CR_sCustomer inner join tb_cr_item c on b.CR_sCheckItem = c.Item_dId "
sql_getresult += "left join tb_cr_main d on c.Item_sSort = d.CR_sRoomName and d.CR_sCustomer = a.Customer_dId "
sql_getresult += "where a.Customer_dId = @peid and a.Customer_sCompany like '友邦保险%'";

app.get('/api/v1/result', function(req, res) {
	if (req.query['key'] !== '72fa4dff') {
		res.status(401).end();
		return;
	}
	let peid = req.query['peid'] || '';
	let f = async function() {
		try {
			let result = await pool80.request()
				.input('peid', peid)
				.query(sql_getresult);
			res.status(200).json({status:{code:0},data:result.recordset});
		} catch(err) {
			console.log(err);
			res.status(500).json(err);
		}
	};
	f();
});

app.use(function(req, res){
	console.log(req.headers);
	console.log(req.body);
	res.status(404).json({status:"Not found"});
});

const server = app.listen(8162, "0.0.0.0", function() {
	    console.log('listening on port %d', server.address().port);
});
