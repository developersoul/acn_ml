<?php

function sc_factory($sc_name, $sc_atts = array(), $template_uri) {
  add_shortcode( $sc_name, function($atts, $content = null) use($sc_atts) {
    $at = shortcode_atts( $sc_atts, $atts );
    ob_start();
    
    if(file_exists($template_uri)) {
      include $template_uri;
    }
    
    return ob_get_clean();
  });

}
?>

