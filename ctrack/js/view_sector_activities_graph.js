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
var budget_sector_data = require("../../dstore/json/budget_sector.json")

view_sector_activities_graph.chunks=[
	"sectors_data_graph" , "sector_budget_graph"
];

view_sector_activities_graph.view=function(args)
{
	ctrack.setcrumb(1);
	ctrack.change_hash();
	var sector_group=ctrack.hash.sector_group;
	var args={};
	args.q={
		"sector_ref":sector_group,
	};
};

view_sector_activities_graph.ajax = function(args)
{
	args=args || {};
	var sector_code = args.q.sector_ref;
	var sector_name = iati_codes['sector_names'][sector_code];

	var sector_year_list = [];//for jqBarGraph
	var sector_data_new ={
		'crs':{},
		'iati':{},
		'amp':{},
	};

	var getBarChart = function(data)
	{
		var content = "<div id='sector_comparision_graph' class='comparison-graph'";
		content += "style='background-color:#F5F5F5; margin:2px 0px 0px 0;'>";
		content += "<script>$('#sector_comparision_graph').jqBarGraph({";
		content += "data:"+data+",";
		content += "colors: ['#CEE9B1','#65ACFF ','#AF947C '],";
		content += "type: 'multi',";
		content += "legends: ['CRS','AMP','IATI'],legend: true,";
		//content += "animate:false,";
		content += "prefix:'USD '});";
		content += "</script></div>";

		return content;
	}

	var getSimpleBarChart = function(data)
	{
		console.log(data);
		var content = "<div id='sector_budget_graph' class='comparison-graph'";
		content += "style='background-color:#F5F5F5; margin:2px 0px 0px 0px;'>";
		content += "<h3>National Budget Allocated</h3>";
		content += "<script>$('#sector_budget_graph').jqbargraph({";
		content += "data:"+data+",";
		//content += "colors: ['#242424','#437346','#97D95C'],";
		content += "colors:['#85C8FF'],legends: ['National Budget'] , legend: true,";
		//content += "animate:false,";
		content += "prefix:'USD '});";
		content += "</script></div>";

		return content;
	}

	var display=function()
	{
		var unique_sector_year_list = [];
		$.each(sector_year_list, function(i, el){
		    if($.inArray(el, unique_sector_year_list) === -1) unique_sector_year_list.push(el);
		});
		sorted_sector_array = unique_sector_year_list.sort();

		var	sector_array = [];
		
		sorted_sector_array.forEach(function(year){
			var crs_value = (year in sector_data_new.crs)?sector_data_new.crs[year]:0;
			var amp_value = (year in sector_data_new.amp)?sector_data_new.amp[year]:0;
			var iati_value = (year in sector_data_new.iati)?sector_data_new.iati[year]:0;
			sector_array.push([[crs_value,amp_value,iati_value],year]);
		});
		
		var graph_content = getBarChart(JSON.stringify(sector_array));
		if("0" in budget_array){
			var budget_graph_content = getSimpleBarChart(JSON.stringify(budget_array));
		}else{
			var budget_graph_content = "<div id='sector_budget_graph' class='comparison-graph'>National Budget Alloacation not available</div>";
		}
		console.log(budget_array);

		ctrack.chunk("sectors_data_graph", graph_content);
		ctrack.chunk("sector_budget_graph", budget_graph_content);
		ctrack.display();

	};

	var list_crs=[];
	//insert crs data if we have it
	var crs=crs_sector[(args.country || ctrack.args.country).toUpperCase()];

	var d={};
	
	d.year = 2012;
	d.amount = crs[sector_name];

	sector_year_list.push(d.year.toString());
	sector_data_new.crs[d.year.toString()]=d.amount;

	var amp=amp_sector_data[ (sector_name)];
	for(var year in amp){
		var v = {};
		v.year = year;
		v.amount = amp[year];
		sector_data_new.amp[v.year]=v.amount;
		sector_year_list.push(year);
	}

	var budget = budget_sector_data[(sector_name)];
	budget_array = [];
	for(var year in budget){
		console.log(year);
		var v = {};
		v.year = year;
		v.amount = budget[year];
		budget_array.push([v.amount,v.year,'#7D252B']);
	}

	var years=[2012,2013,2014];
	years.forEach(function(year)
	{
		sector_year_list.push(year.toString());
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
			if("0" in data['rows']){
				d.amount = parseInt(data['rows'][0]['sum_of_percent_of_trans_usd']);
			}else{
				d.amount = 0;
			}
			sector_data_new.iati[d.year]=d.amount;

			display();
				
		};

		fetch.ajax(dat,callback);
	});
};