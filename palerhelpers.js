function paler_analysis(estimation_method, data) {
    var curr_volume = approx_mult_factor(data.y, volume_min);
    var curr_space = approx_mult_factor(data.x, space_min);

    var vol_min_depth = Math.floor(volume_min / curr_space);
    if (volume_min % curr_space != 0) {
        vol_min_depth++;
    }

    var volume_in_case_no_depth_scale = space_min * vol_min_depth;
    var threshold = Math.floor(curr_volume / volume_in_case_no_depth_scale);
    if (curr_volume % volume_in_case_no_depth_scale != 0) {
        threshold++;
    }

    /*
        Check if the volume of the computed threshold implies a distance that is equal to the threshold
    */
    var recomputed_volume = volume_in_case_no_depth_scale * threshold;
    var recalc = calculate_total(estimation_method, recomputed_volume, space_min, total_failure_rate, phys_error_rate);

    var ret = {
        dist: recalc.dist,
        ok: (recalc.dist <= threshold),
        threshold: threshold,
        volume: recomputed_volume
    }

    return ret;
}