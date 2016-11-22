<?php
$dir_base =  str_replace('apis', '', __DIR__);
require $dir_base . 'vendor/autoload.php';

function infusion_create_contact() {
  try{
    $apikey = 'd871db40497cbbd7c9e25898749d128d';
    $app = new iSDK();
    $contactData = array('FirstName' => 'John', 'LastName'  => 'Doe', 'Email' => 'JDoe@email.com');
    $res = $app->addCon($contactData);
    return $res;
  } catch(Exception $e) {
    return $e;
  }
}
