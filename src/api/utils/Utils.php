<?php
/**
 * Created by PhpStorm.
 * User: Johan
 * Date: 09/02/2015
 * Time: 18:20
 */

class Utils {
    public static function checkParams($type, $params, $val = null) {
        if (is_array($params)) {
            foreach ($params as $i => $p) {
                Utils::checkParam($type, $p, $val, $i);
            }
        } else {
            Utils::checkParam($type, $params, $val);
        }
    }

    public static function checkPassword($password) {
        if ($password != "b1889094079e73358b72111e680ff087") {
            throw new Exception("Bad password.");
        }
    }

    private static function checkParam($t, $p, $val, $i = 0) {
        if (!isset($t[$p]) || empty($t[$p])) {
            throw new Exception("Parameter $p do not exist or is empty.");
        }

        if ($val && is_array($val) && $i < count($val)) {
            Utils::checkVal($t, $p, $val[$i]);
        } else if ($val && !is_array($val)) {
            Utils::checkVal($t, $p, $val);
        }
    }

    private static function checkVal($t, $p, $val) {
        if (is_array($val) && !in_array($t[$p], $val)) {
            throw new Exception("Parameter $p should be equal to one of those values: ".implode(", ", $val).".");
        } else if (!is_array($val) && $t[$p] != $val) {
            throw new Exception("Parameter $p should be equal to $val.");
        }
    }
}