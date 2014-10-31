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
	"iati_graph_top_five_value", "crs_graph_top_five_value", "amp_graph_top_five_value"
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

	var getSimpleBarChart = function(data,donor,color,max_value)
	{
		var content = "<div id='donor_comparision_graph_"+donor+"' class='comparison-graph'>";
		content += "<h3>Top 5 Donor as per " + donor + " 2012 </h3>";
		content += "<script>$('#donor_comparision_graph_"+donor+"').jqbargraph({";
		content += "data:"+data+",";
		content += "colors:['"+color+"'],legends: ['"+donor+"'] , legend: true,maxValue:"+max_value+",";
		content += "prefix:'USD '});";
		content += "</script></div>";

		return content;
	}

	var display=function()
	{
		var max_value = Math.max(iati_top5_array[0][0],crs_top5_array[0][0],amp_top5_array[0][0]);
		
		var iati_top5_array_content = getSimpleBarChart(JSON.stringify(iati_top5_array),"IATI","#00c475",max_value);
		var crs_top5_array_content = getSimpleBarChart(JSON.stringify(crs_top5_array),"CRS","#5B6572",max_value);
		var amp_top5_array_content = getSimpleBarChart(JSON.stringify(amp_top5_array),"AMP","#008fff",max_value);
		
		ctrack.chunk("iati_graph_top_five_value", iati_top5_array_content);
		ctrack.chunk("crs_graph_top_five_value", crs_top5_array_content);
		ctrack.chunk("amp_graph_top_five_value", amp_top5_array_content);

		ctrack.display();
	};

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
	var crs_top5_array = [];
	for( var i=0; i<5 ; i++ )
	{
		var v=list_crs[i];
		if(v)
		{
			v.sum_of_percent_of_usd=v.usd//Math.floor(100*v.usd/top)
			v.funder=iati_codes.crs_funders[v.funder] || iati_codes.country[v.funder] || v.funder;
			crs_top5_array.push([v.sum_of_percent_of_usd,v.funder,'#5B6572']);
		}
	}

	var list_amp = [];
	var amp=amp_2012_commitment[ (args.country || ctrack.args.country).toUpperCase() ];
	var amp = amp['2012'];
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
	var amp_top5_array = [];
	for( var i=0; i<5 ; i++ )
	{
		var v=list_amp[i];
		if(v)
		{
			v.sum_of_percent_of_usd=v.usd//Math.floor(100*v.usd/top)
			v.funder=iati_codes.crs_funders[v.funder] || iati_codes.country[v.funder] || v.funder;
			amp_top5_array.push([v.sum_of_percent_of_usd,v.funder,'#008fff']);
		}
	}

	var years=[2012];
	var iati_top5_array = [];

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
			for(var i=0;i<data.rows.length;i++)
			{
				var v=data.rows[i];
				d.funder=iati_codes.funder_names[v.funder_ref] || iati_codes.publisher_names[v.funder_ref] || iati_codes.country[v.funder_ref] || v.funder_ref;

				// d.funder = iati_codes.crs_funders[v.funder_ref] || iati_codes.country[v.funder_ref] || v.funder_ref;
				d.sum_of_percent_of_usd = parseInt(v.sum_of_percent_of_trans_usd);
				iati_top5_array.push([d.sum_of_percent_of_usd,d.funder,'#00c475']);
			}
			display();
		};
		fetch.ajax(dat,callback);
	});
};