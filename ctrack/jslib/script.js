$(document).ready(function(){
 $( ".graphBardonor_comparision_graph_IATI" ).hover(
  function() {
    $(this).siblings('.graphValuedonor_comparision_graph_IATI').css('display','block');
  }, function() {
    $(this).siblings('.graphValuedonor_comparision_graph_IATI').css('display','none');
  }
 );
 
 $( ".graphBardonor_comparision_graph_CRS" ).hover(
  function() {
   $(this).siblings('.graphValuedonor_comparision_graph_CRS').css('display','block');
  }, function() {
   $(this).siblings('.graphValuedonor_comparision_graph_CRS').css('display','none');
  }
 );
 
 $( ".graphBardonor_comparision_graph_AMP" ).hover(
  function() {
   $(this).siblings('.graphValuedonor_comparision_graph_AMP').css('display','block');
  }, function() {
   $(this).siblings('.graphValuedonor_comparision_graph_AMP').css('display','none');
  }
 );
 

});