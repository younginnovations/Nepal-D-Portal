
var view_donors_comparsison=exports;
exports.name="stats";

var ctrack=require("./ctrack.js")
var plate=require("./plate.js")
var iati=require("./iati.js")
var fetch=require("./fetch.js")

var refry=require("../../dstore/js/refry.js")
var iati_codes=require("../../dstore/json/iati_codes.json")
var crs_year=require("../../dstore/json/crs_2012.json")
var amp_2012_commitment =require("../../dstore/json/amp_2012_commitment.json")

view_donors_comparsison.chunks=[
	"graph_top_five_value",
];

view_donors_comparsison.view=function(args)
{
	//view_donors_comparsison.chunks.forEach(function(n){ctrack.chunk(n,"{spinner_in_table_row}");});
	ctrack.setcrumb(1);
	ctrack.change_hash();
	view_donors_comparsison.ajax(args);
};

view_donors_comparsison.ajax = function(args)
{
	args=args || {};

	ctrack.graph_top_five={
		'iati': {'funder':[], 'sum_of_percent_of_usd': []},
		'crs': {'funder':[], 'sum_of_percent_of_usd': []},
		'amp': {'funder':[], 'sum_of_percent_of_usd': []}
	};

	var getBarChart = function(selector, cat, data, title)
	{
		var content = '';
		content += "$('"+selector+"').highcharts({";
        content += "chart: {type: 'column', height: 400, marginBottom: 60}, title: { text: '"+title+"'},";
       	content += "xAxis: {categories: ["+cat+"]},";
        content += "yAxis: {min: 0, max: 250000000, title: {text: 'Amount ($)'}},";
        content += "plotOptions: {column: {pointPadding: 0.2,borderWidth: 0}},";
        content += "series: [{showInLegend: false, name: 'Fund',data: [" + data + "]}]";
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

  		var content = '<script type="text/javascript">';
		content += "$(function () {";

		var iati_funder = getArrayToString(ctrack.graph_top_five.iati.funder);
		var crs_funder = getArrayToString(ctrack.graph_top_five.crs.funder);
		var amp_funder = getArrayToString(ctrack.graph_top_five.amp.funder);

		//console.log(iati_funder);
		//console.log(crs_funder);
		//console.log(amp_funder);

		content += getBarChart('.donor_iati_five', iati_funder, ctrack.graph_top_five.iati.sum_of_percent_of_usd.toString(), 'Top 5 Donor as per IATI 2012');
		content += getBarChart('.donor_crs_five', crs_funder, ctrack.graph_top_five.crs.sum_of_percent_of_usd.toString(), 'Top 5 Donor as per CRS 2012');
		content += getBarChart('.donor_amp_five', amp_funder, ctrack.graph_top_five.amp.sum_of_percent_of_usd.toString(), 'Top 5 Donor as per AMP 2012');

		content += "});";
		content += "</script>";

		ctrack.chunk("graph_top_five_value", content);
		ctrack.display();
	};

	var fadd=function(d)
	{
		switch (d.data_type)
		{
			case "iati":
				ctrack.graph_top_five.iati.funder.push(d.funder);
				ctrack.graph_top_five.iati.sum_of_percent_of_usd.push(d.sum_of_percent_of_usd);
				break;
			case "crs":
				ctrack.graph_top_five.crs.funder.push(d.funder);
				ctrack.graph_top_five.crs.sum_of_percent_of_usd.push(d.sum_of_percent_of_usd);
				break;
			case "amp":
				ctrack.graph_top_five.amp.funder.push(d.funder);
				ctrack.graph_top_five.amp.sum_of_percent_of_usd.push(d.sum_of_percent_of_usd);
				break;
		}
	}


	var list_crs=[];
// 	insert crs data if we have it
	var crs=crs_year[ (args.country || ctrack.args.country).toUpperCase() ];
	for(var n in crs)
	{
		var d={};
		d.funder=n;
		d.usd=crs[n];
		list_crs.push(d);
	}
	list_crs.sort(function(a,b){
		return ( (b.usd||0)-(a.usd||0) );
	});

	var top=list_crs[0].usd;
	var s=[];
	for( var i=0; i<5 ; i++ )
	{
		var v=list_crs[i];
		if(v)
		{
			v.sum_of_percent_of_usd=v.usd//Math.floor(100*v.usd/top)
			v.funder=iati_codes.crs_funders[v.funder] || iati_codes.country[v.funder] || v.funder;
			v.data_type = 'crs'
			fadd(v);
		}
	}
	//console.log(ctrack.graph_top_five);

	var list_amp = [];
	var amp=amp_2012_commitment[ (args.country || ctrack.args.country).toUpperCase() ];
	for(var n in amp)
	{
		var d={};
		d.funder=n;
		d.usd=crs[n];
		list_amp.push(d);
	}
	list_amp.sort(function(a,b){
		return ( (b.usd||0)-(a.usd||0) );
	});

	var top=list_amp[0].usd;
	var s=[];
	for( var i=0; i<5 ; i++ )
	{
		var v=list_amp[i];
		if(v)
		{
			v.sum_of_percent_of_usd=v.usd//Math.floor(100*v.usd/top)
			v.funder=iati_codes.crs_funders[v.funder] || iati_codes.country[v.funder] || v.funder;
			v.data_type = 'amp';
			fadd(v);
		}
	}

	//console.log(ctrack.graph_top_five);
	
	var years=[2012];
	years.forEach(function(year)
	{
		var dat={
				"from":"act,trans,country",
				"limit":args.limit || 5,
				"select":"funder_ref,sum_of_percent_of_trans_usd",
				"funder_ref_not_null":"",
				"groupby":"funder_ref",
				"trans_code":"D|E",
				"trans_day_gteq":year+"-01-01","trans_day_lt":(parseInt(year)+1)+"-01-01",
				"country_code":(args.country || ctrack.args.country),
				"orderby":"2-"
			};

		var callback=function(data){
			var d = {};
			//console.log(data);
			for(var i=0;i<data.rows.length;i++)
			{
				var v=data.rows[i];
				d.funder=iati_codes.funder_names[v.funder_ref] || iati_codes.publisher_names[v.funder_ref] || iati_codes.country[v.funder_ref] || v.funder_ref;

				// d.funder = iati_codes.crs_funders[v.funder_ref] || iati_codes.country[v.funder_ref] || v.funder_ref;
				d.sum_of_percent_of_usd = v.sum_of_percent_of_trans_usd;
				d.data_type = "iati";
				fadd(d);
			}
			display();
		};
		fetch.ajax(dat,callback);
	});
};