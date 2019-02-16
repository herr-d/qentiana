// Gate error rate that sets how quickly logical errors are suppressed. 1e-3 means a factor of 10 suppression with each increase of d by 2.
// var austin_characteristic_gate_error_rate = 0.001;

function austin_p_logical(p_gate, d)
{
    return 0.1 * Math.pow((100*p_gate), ((d + 1) / 2));
}

function austin_distance(p_gate, p_l)
{
    var min_dist = 3;
    var max_dist = 1000;
    for (var d = min_dist; d <= max_dist; d = d+2)
    {
        if(austin_p_logical(p_gate, d) < p_l)
        {
            return d;
        }
    }
    console.log("Austin_distance_error!" + p_gate + " " + p_l);
    return 0;
}

function austin_data_qubits(space, total_volume, safety_factor, characteristic_gate_error_rate)
{
    var target_error_per_data_round = 1 / (safety_factor * total_volume);

    if(target_error_per_data_round == 0)
    {
        console.log("FLOAT ZERO!" + total_volume);
    }
    
    var data_code_distance = austin_distance(characteristic_gate_error_rate, target_error_per_data_round);
    
    // var num_data_qubits = space * 2 * Math.pow(data_code_distance, 2);
    var num_data_qubits = number_of_physical_qubits(data_code_distance, space);

    var ret = {
        distance : data_code_distance,
        qubits: num_data_qubits
    }
    return ret;
}