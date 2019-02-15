function logical_error_probability(d, p_cycle)
{
    /*
        Use equation from fowlers paper on logical error rate
    */
    var p0 = d * local_factorial(d);
    var p1 = local_factorial(((d+1)/2) - 1);
    var p2 = local_factorial((d+1)/2);
    var tmp =  p0 / ( p1 * p2 );

    return tmp * Math.pow(p_cycle, (d + 1)/2);
}

function calc_distance(p_err_out, p_cycle, spacetime_volume)
{
    // Find the lowest distance for which the error rate of the whole circuit
    // is given by less than p_err_out. Given an error rate per step of p_cycle.  
    // python range is < or <=?
    var min_dist = 3;
    var max_dist = 99;

    for (var d = min_dist; d <= max_dist; d++)
    {
        var log_err_prob = logical_error_probability(d, p_cycle);
        var val_to_compare = 1 - Math.pow(( 1 - log_err_prob), spacetime_volume);

        if(p_err_out > val_to_compare)
        {
            return d;
        }
    }

    // "Could not find a suitable distance"
    return -1;
}

function number_of_physical_qubits(distance, space)
{
    //  only looking at data qubits
    return space * distance * distance;
}