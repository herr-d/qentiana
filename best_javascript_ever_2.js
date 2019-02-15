function resource_line_plot(total_failure_rate, volume_min, space_min, p_err){
    var data = new Array(); // stores the line plot for no physical qubits
    var dist_changes = new Array(); // stores the volume factors for which the distance changes
    var dist_last = -1;
    var volume_param = 0;
    var ret = 0;

    for (var i=0; i<global_v.length; i++)
    {
        volume_param = volume_min * global_v[i];
        //maybe change names for this data array because different meaning of output
        ret = calculate_total(volume_param, space_min, total_failure_rate, p_err);
        
        if (dist_last != -1 && dist_last != ret.dist){
            dist_changes.push({
                x: global_v[i],
                new_dist: ret.dist
            })
        }
        
        dist_last = ret.dist;
        
        data.push({
            x: global_v[i],
            number_of_physical_qubits: ret.number_of_physical_qubits,
            dist: ret.dist
        })
    }
    return {data: data, dist_changes: dist_changes};
}



// needs access to D3 functionality mainly the svg to plot in and x/yScale
function draw_vertical_line(y_min, y_max, x_pos){
    var data = [{x: xpos, y: y_min}, {x: x_pos, y: y_max}]
    var line = d3.svg.line()
        .x(function(d,i) {
            return xScale(d.x);})
        .y(function(d,i) {
           return yScale(d.y);});
    svg.append("svg:path").attr("d", line(data));
}

function draw_vertical_line(y_min, y_max, x_pos){
    var data = [{x: x_pos, y: y_min}, {x: x_pos, y: y_max}]
    var line = d3.svg.line()
        .x(function(d,i) {
            console.log(d.x);
            return xScale(d.x);})
        .y(function(d,i) {
            console.log(d.x);
           return yScale(d.y);});
    svg.append("svg:path").attr("class","vertical_line").attr("d", line(data));
}

// needs access to 
function draw_line_plot(data, svg){
    var line = d3.svg.line()
        .x(function(d,i) {
            return xScale(d.x);})
        .y(function(d,i) {
            return yScale(d.number_of_physical_qubits);});

    svg.append("svg:path").attr("class","line_plot").attr("d", line(data));
}





///changes in plotting
// y values for the plot
var y_axis = local_logspace(1, 5, nr_items);


//updated plot parameters
var xScale = d3.scale.linear()
    .domain([global_v[0],global_v[global_v.length-1]])
    .range([0, global_v.length * itemSize]);

var xAxis = d3.svg.axis()
    .scale(xScale)
    .orient("bottom");

var yScale = d3.scale.log()
    .domain([y_axis[0],y_axis[y_axis.length-1]])
    .range([y_axis.length * itemSize,0]);

var yAxis = d3.svg.axis()
    .scale(yScale)
    .ticks(6, function(d) { return 10 + formatPower(Math.round(Math.log(d) / Math.LN10)); })
    .orient("left");

//actually plot the stuff
update_data();