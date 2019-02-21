/*
    TODO: Repair bug when determining error rate from forced distance
    Below we are forcing much lower distances such that the one we compute is the commented one
    APPROXIMATION ERRORS
*/
var experiment_only_clifford_ccz_1 = {
    volume : 8.36661126433567E+016,
    footprint : 18447, 
    physical_error_rate : 0.001,
    //params to the chart classes
    routing_overhead: 50,
    bool_distance: true,
    enforced_distance: 34.7,//35,
    safety_factor : 200
};

var experiment_only_clifford_ccz_2 = {
    volume : 327618727122432,
    footprint : 4623, 
    physical_error_rate : 0.001,
    //params to the chart classes
    routing_overhead: 50,
    bool_distance: true,
    enforced_distance: 30.7,//31,
    safety_factor : 200
};

var experiment_only_clifford_ccz_3 = {
    volume : 756142777500,
    footprint : 512, 
    physical_error_rate : 0.001,
    //params to the chart classes
    routing_overhead: 50,
    bool_distance: true,
    enforced_distance: 24.7,//29,
    safety_factor : 9900
};

var experiment_only_clifford_ccz_4 = {
    volume : 4591836000,
    footprint : 185,
    physical_error_rate : 0.001,
    //params to the chart classes
    routing_overhead: 50,
    bool_distance: true,
    enforced_distance: 18.7,//23,
    safety_factor : 9900
};

var experiment_only_clifford_ccz_5 = {
    volume : 131250000000,
    footprint : 150,
    physical_error_rate : 0.001,
    //params to the chart classes
    routing_overhead: 50,
    bool_distance: true,
    enforced_distance: 24.7,//23,
    safety_factor : 9900
};

var experiment_bristlecone = {
    volume : 6 * 2,
    footprint : 6,
    physical_error_rate : 0.001,
    //params to the chart classes
    routing_overhead: 200,
    bool_distance: false,
    enforced_distance: -1
};

var experiment_t_gate_litinski = {
    volume : 23 * 11,
    footprint : 11,
    physical_error_rate : 0.001,
    //params to the chart classes
    routing_overhead: 50,
    bool_distance: true,
    enforced_distance: 30.7,
    safety_factor: 9900
};