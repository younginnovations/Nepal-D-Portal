var view_sector_activities_graph=exports;
exports.name="stats";

var ctrack=require("./ctrack.js")
var plate=require("./plate.js")
var iati=require("./iati.js")
var fetch=require("./fetch.js")

var refry=require("../../dstore/js/refry.js")
var iati_codes=require("../../dstore/json/iati_codes.json")
var crs_sector=require("../../dstore/json/crs_2012_sectors.json")
var amp_sector_data = require("../../dstore/json/sector_data.json")


view_sector_activities_graph.chunks=[
	"sector_graph",
];

view_sector_activities_graph.view=function(args)
{
	//view_donors_comparsison.chunks.forEach(function(n){ctrack.chunk(n,"{spinner_in_table_row}");});
	ctrack.setcrumb(1);
	ctrack.change_hash();
	var sector_group=ctrack.hash.sector_group;
	var args={};
	args.q={
		"sector_ref":sector_group,
	};
	view_sector_activities_graph.ajax(args);
};

view_sector_activities_graph.ajax = function(args)
{
	args=args || {};
	var sector_code = args.q.sector_ref;
	var sector_name = iati_codes['sector_names'][sector_code] /*|| iati_codes['country'][donor]*/;
	
	ctrack.sector_graph={
		'iati': {'year':[], 'amount': []},
		'crs': {'year':[], 'amount': []},
		'amp': {'year':[], 'amount': []}
	};
	iati_list = [];
	var getBarChart = function(selector, cat, data, title)
	{
		var content = '';
		content += "$('"+selector+"').highcharts({";
        content += "chart: {type: 'column', height: 400, marginBottom: 60}, title: { text: '"+title+"'},";
       	content += "xAxis: {categories: ["+cat+"]},";
        content += "yAxis: {min: 0, title: {text: 'Amount ($)'}},";
        content += "plotOptions: {column: {pointPadding: 0.2,borderWidth: 0}},";
        content += "series: [{showInLegend: false, name: 'Fund',data: [" +data+ "]}]";
		content += "});";

		return content;
	}

	var getArrayToString = function(data)
	{
		var result = '';
		for (var i=0; i<data.length; i++){
		    result += "'"+ data[i] + "'";
		    if(data.length > 1 && i<data.length-1){
		        result += ",";
		    }
		}

		return result;
	}

	var display=function()
	{
		ctrack.sector_graph.iati.year=[];
		ctrack.sector_graph.iati.amount=[];

		iati_list.sort(function(a,b){
			return ( (a.year||0)-(b.year||0) );
		});

		iati_list.forEach(function(sector_year){
			var v={};
			v.year = sector_year.year;
			v.amount = sector_year.amount;
			v.data_type = 'iati';
			fadd(v);
		})

  		var content = '<script type="text/javascript">';
		content += "$(function () {";

		var iati_year = getArrayToString(ctrack.sector_graph.iati.year);
		var crs_year = getArrayToString(ctrack.sector_graph.crs.year);
		var amp_year = getArrayToString(ctrack.sector_graph.amp.year);

		content += getBarChart('.donor_iati_five', iati_year, ctrack.sector_graph.iati.amount.toString(), 'According to IATI, The Amount Donated to ' + sector_name + ' sector in Years');
		content += getBarChart('.donor_crs_five', crs_year, ctrack.sector_graph.crs.amount.toString(), 'According to CRS, The Amount Donated to ' + sector_name + ' sector in Years');
		content += getBarChart('.donor_amp_five', amp_year, ctrack.sector_graph.amp.amount.toString(), 'According to AMP, The Amount Donated to ' + sector_name + ' sector in Years');

		content += "});";
		content += "</script>";

		ctrack.chunk("sector_graph", content);
		ctrack.display();
	};

	var fadd=function(d)
	{
		switch (d.data_type)
		{
			case "iati":
				ctrack.sector_graph.iati.year.push(d.year);
				ctrack.sector_graph.iati.amount.push(d.amount);
				break;
			case "crs":
				ctrack.sector_graph.crs.year.push(d.year);
				ctrack.sector_graph.crs.amount.push(d.amount);
				break;
			case "amp":
				ctrack.sector_graph.amp.year.push(d.year);
				ctrack.sector_graph.amp.amount.push(d.amount);
				break;
		}
	}

	//var donor = args.q.funder_ref;
	var list_crs=[];
	//insert crs data if we have it
	var crs=crs_sector[(args.country || ctrack.args.country).toUpperCase()];

	var d={};
	d.year = 2012;
	d.amount = crs[sector_name];
	list_crs.push(d);

	list_crs.forEach(function(sector_year){
		var v=sector_year;
		v.data_type = 'crs'
		fadd(v);
		
	});

	var amp=amp_sector_data[ (sector_name)];
	console.log(amp);
	for(var year in amp){
		var v = {};
		v.year = year;
		v.amount = amp[year];
		console.log(amp[year]);
		v.data_type = 'amp';
		fadd(v); 
	}
	
	var years=[2012,2013,2014];
	years.forEach(function(year)
	{
		var dat={
				"from":"trans,country,sector",
				"select":"sector_group,sum_of_percent_of_trans_usd",
				"sector_group":sector_code,
				"groupby":"sector_group",
				"trans_code":"D|E",
				"trans_day_gteq":year+"-01-01","trans_day_lt":(parseInt(year)+1)+"-01-01",
				"country_code":(args.country || ctrack.args.country_select),
			};

		var callback=function(data){
			var d = {};
			d.year = year;
			d.amount = data['rows'][0]['sum_of_percent_of_trans_usd'];
			iati_list.push(d);
			
			display();
				
		};
		fetch.ajax(dat,callback);
	});
};