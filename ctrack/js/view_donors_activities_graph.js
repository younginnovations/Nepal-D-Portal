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
	"donor_graph",
];

view_donors_comparsison.view=function(args)
{
	//view_donors_comparsison.chunks.forEach(function(n){ctrack.chunk(n,"{spinner_in_table_row}");});
	ctrack.setcrumb(1);
	ctrack.change_hash();
	var funder=ctrack.hash.funder;
	var args={};
	args.q={
		"funder_ref":funder,
	};
	view_donors_comparsison.ajax(args);
};

view_donors_comparsison.ajax = function(args)
{
	args=args || {};
	var donor = args.q.funder_ref;
	var donor_name = iati_codes['funder_names'][donor] || iati_codes['country'][donor];

	ctrack.donor_graph={
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
		ctrack.donor_graph.iati.year=[];
		ctrack.donor_graph.iati.amount=[];

		iati_list.sort(function(a,b){
			return ( (a.year||0)-(b.year||0) );
		});

		iati_list.forEach(function(donor_year){
			var v={};
			v.year = donor_year.year;
			v.amount = donor_year.amount;
			v.data_type = 'iati';
			fadd(v);
		})

  		var content = '<script type="text/javascript">';
		content += "$(function () {";

		var iati_year = getArrayToString(ctrack.donor_graph.iati.year);
		var crs_year = getArrayToString(ctrack.donor_graph.crs.year);
		var amp_year = getArrayToString(ctrack.donor_graph.amp.year);

		content += getBarChart('.donor_iati_five', iati_year, ctrack.donor_graph.iati.amount.toString(), 'According to IATI, The Amount Donated by ' + donor_name + ' in Years');
		content += getBarChart('.donor_crs_five', crs_year, ctrack.donor_graph.crs.amount.toString(), 'According to CRS, The Amount Donated by ' + donor_name + ' in Years');
		content += getBarChart('.donor_amp_five', amp_year, ctrack.donor_graph.amp.amount.toString(), 'According to AMP, The Amount Donated by ' + donor_name + ' in Years');

		content += "});";
		content += "</script>";

		ctrack.chunk("donor_graph", content);
		ctrack.display();
	};

	var fadd=function(d)
	{
		switch (d.data_type)
		{
			case "iati":
				ctrack.donor_graph.iati.year.push(d.year);
				ctrack.donor_graph.iati.amount.push(d.amount);
				break;
			case "crs":
				ctrack.donor_graph.crs.year.push(d.year);
				ctrack.donor_graph.crs.amount.push(d.amount);
				break;
			case "amp":
				ctrack.donor_graph.amp.year.push(d.year);
				ctrack.donor_graph.amp.amount.push(d.amount);
				break;
		}
	}

	//var donor = args.q.funder_ref;
	var list_crs=[];
// 	insert crs data if we have it
	var crs=crs_year[ (args.country || ctrack.args.country).toUpperCase() ];
	var d={};
	d.year = 2012;
	d.amount = crs[donor];
	list_crs.push(d);

	list_crs.forEach(function(donor_year){
		var v=donor_year;
		v.data_type = 'crs'
		fadd(v);
		
	});

	var amp=amp_2012_commitment[ (args.country || ctrack.args.country).toUpperCase() ];

	for(var year in amp){
		var v = {};
		v.year = year;
		v.amount = amp[year][donor];
		v.data_type = 'amp';
		fadd(v); 
	}
	
	var years=[2012,2013,2014];
	years.forEach(function(year)
	{
		var dat={
				"from":"act,trans,country",
				"limit":args.limit || 5,
				"select":"funder_ref,sum_of_percent_of_trans_usd",
				"funder_ref":donor,
				"groupby":"funder_ref",
				"trans_code":"D|E",
				"trans_day_gteq":year+"-01-01","trans_day_lt":(parseInt(year)+1)+"-01-01",
				"country_code":(args.country || ctrack.args.country),
				"orderby":"2-"
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