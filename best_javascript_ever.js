

function get_max_dist_from_qubits(logical_qubits, total_physical_qubits){
	// Calculates the maximum distance given a fixed number of physical qubits

    if(logical_qubits > total_physical_qubits){
        return -1;
    }
    return Math.floor(Math.sqrt(total_physical_qubits/logical_qubits));
}

function total_err(indiv_err, volume){
	// given a per step error rate calculate the total error of the computation
    return Math.pow(1 - indiv_err, volume);
}

// TODO INPUT IS CHANGED FROM total_failure_rate TO total_num_physical_qubits
function gen_fixed_physical_resources(total_num_physical_qubits,
	volume_min, space_min, p_err){

    var data = new Array();
    var dist = 0;
    var space_param = 0;
    var volume_param = 0;
    var P_out = 0;

    for (var i=0; i<global_v.length; i++)
    {
        for(var j=0; j < global_s.length; j++)
        {
            space_param = Math.ceil(space_min * global_s[j]);
            volume_param = Math.ceil(volume_min * global_v[i]);
            dist = get_max_dist_from_qubits(space_param,total_num_physical_qubits);
            var indiv_err = austin_p_logical(p_err, dist);
            P_out = total_err(indiv_err, volume_param);

            //maybe change names for this data array because different meaning of output
            data.push({
                x: global_s[j],
                y: global_v[i],
                dist_opt_vol : dist,
                dist_opt_space : indiv_err,
                nr_target_vol : volume_param,
                nr_target_space : number_of_physical_qubits(dist, space_param),
                ratio: P_out
            })
        }
    }
    return data;
}