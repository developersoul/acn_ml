<?php

function bs_help_form_sc($atts, $content = null) {
	$at = shortcode_atts( array(), $atts);
	ob_start();
?>
	<div class="bs-help-form"></div>
<?php
	return ob_get_clean();
}

add_shortcode('bs_help_form', 'bs_help_form_sc');