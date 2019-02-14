// Gate error rate that sets how quickly logical errors are suppressed. 1e-3 means a factor of 10 suppression with each increase of d by 2.
// var austin_characteristic_gate_error_rate = 0.001;

function austin_p_logical(p_gate, d)
{
    return 0.1 * Math.pow((9.9*p_gate), ((d + 1) / 2));
}


function austin_distance(p_gate, p_l)
{
    var d = 3;
    while (austin_p_logical(p_gate, d) > p_l)
    {
        d = d + 2;
    }
    return d;
}

function austin_data_qubits(space, total_volume, safety_factor, characteristic_gate_error_rate)
{
    var target_error_per_data_round = 1 / (safety_factor * total_volume);
    
    var data_code_distance = austin_distance(characteristic_gate_error_rate, target_error_per_data_round);
    var num_data_qubits = space * 2 * Math.pow(data_code_distance, 2);

    var ret = {
        distance : data_code_distance,
        qubits: num_data_qubits
    }
    return ret;
}