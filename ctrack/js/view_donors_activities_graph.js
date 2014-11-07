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
	"donors_data_graph"
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
};

view_donors_comparsison.ajax = function(args)
{
	args=args || {};
	var donor = args.q.funder_ref;
	var donor_name = iati_codes['funder_names'][donor] || iati_codes['country'][donor];

	var donor_year_list = [];//for jqBarGraph
	var donor_data_new ={
		'crs':{},
		'iati':{},
		'amp':{},
	};

	var jqgetBarChart = function(data)
	{
		var content = "<div id='donor_comparision_graph' class='comparison-graph'";
		content += "style='background-color:#F5F5F5; margin:2px 0px 0px 0px;'>";
		content += "<script>$('#donor_comparision_graph').jqBarGraph({";
		content += "data:"+data+",";
		content += "colors: ['#65ACFF','#AF947C','#CEE9B1 '],";
		content += "type: 'multi',";
		content += "legends: ['CRS','AMP','IATI'],legend: true,width:512,";
		//content += "animate:false,";
		content += "prefix:'USD '});";
		content += "</script></div>";

		return content;
	}

	var display=function()
	{
		var unique_donor_year_list = [];
		$.each(donor_year_list, function(i, el){
		    if($.inArray(el, unique_donor_year_list) === -1) unique_donor_year_list.push(el);
		});
		sorted_donor_array = unique_donor_year_list.sort();

		var	donor_array = [];
		
		sorted_donor_array.forEach(function(year){
			var crs_value = (year in donor_data_new.crs)?donor_data_new.crs[year]:0;
			var amp_value = (year in donor_data_new.amp)?donor_data_new.amp[year]:0;
			var iati_value = (year in donor_data_new.iati)?donor_data_new.iati[year]:0;
			donor_array.push([[crs_value,amp_value,iati_value],year]);
		});
		
		var graph_content = jqgetBarChart(JSON.stringify(donor_array));

		ctrack.chunk("donors_data_graph", graph_content);

		ctrack.display();
	};

	var list_crs=[];
// 	insert crs data if we have it
	var crs=crs_year[ (args.country || ctrack.args.country).toUpperCase() ];
	var d={};
	d.year = 2012;
	d.amount = crs[donor];

	donor_year_list.push(d.year.toString());
	donor_data_new.crs[d.year.toString()]=d.amount;

	var amp=amp_2012_commitment[ (args.country || ctrack.args.country).toUpperCase() ];

	for(var year in amp){
		var v = {};
		v.year = year;
		v.amount = amp[year][donor];
		donor_data_new.amp[v.year]=v.amount;
		donor_year_list.push(year);
	}
	
	var years=[2012,2013,2014];
	years.forEach(function(year)
	{
		donor_year_list.push(year.toString());
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
			if("0" in data['rows']){
				d.amount = parseInt(data['rows'][0]['sum_of_percent_of_trans_usd']);
			}else{
				d.amount = 0;
			}
			donor_data_new.iati[d.year]=d.amount;
			display();
				
		};
		fetch.ajax(dat,callback);
	});
};