function Schneegloeckchen(name, vis_options, estimation_method)
{
    /*
        Parameters
    */
    this.nr_items = 100;
    // log spaced volume scaling factor
    this.global_v = local_logspace(-2, 2, this.nr_items);
    // scaling factor space
    this.global_s = local_linspace(0, 2, this.nr_items);
    // name of the div
    this.plot_name = name;
    //
    this.options = vis_options;
    //
    this.estimation_method = estimation_method;
    //
    var ref = this;

    this.xScale_local = d3.scale.linear()
        .domain([ref.global_s[0], ref.global_s[ref.global_s.length - 1]])
        .range([0, ref.global_s.length * ref.options.itemSize]);

    this.xAxis = d3.svg.axis()
        .scale(ref.xScale_local)
        .orient("bottom");

    this.yScale_local = d3.scale.log()
        .domain([ref.global_v[0], ref.global_v[ref.global_v.length - 1]])
        .range([ref.global_v.length * ref.options.itemSize, 0]);

    this.yAxis = d3.svg.axis()
        .scale(ref.yScale_local)
        .ticks(6, function(d) { return 10 + formatPower(Math.round(Math.log(d) / Math.LN10)); })
        .orient("left");


    this.explanation = "Tradeoff between X and Y";
    var container = document.getElementsByClassName(this.plot_name.replace(".", ""))[0];
    container.innerHTML += "<p>" + this.explanation;
    container.innerHTML += "<a href=\"#\" onclick=\"save_as_svg('" + this.plot_name.replace(".", "") +"')\"> Download SVG</a></p>";
}

Schneegloeckchen.prototype.init_visualisation = function()
{
    var ref = this;
    //
    var svg = d3.select(ref.plot_name).append("svg")
        .attr("width", ref.options.width + ref.options.margin.left + ref.options.margin.right)
        .attr("height", ref.options.height + ref.options.margin.top + ref.options.margin.bottom)
        .append("g")
        .attr("id", "plotsvg" + ref.plot_name.replace(".", ""))
        .attr("transform", "translate(" + ref.options.margin.left + "," + ref.options.margin.top + ")");

    svg.append("g")
        .attr("class", "y axis")
        .attr("transform", "translate(-2, " + (ref.options.cellSize/2) + ")")
        .call(ref.yAxis)
        .selectAll('text')
        .attr('font-weight', 'normal');

    svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(" + (ref.options.cellSize/2) + ", " + ((ref.global_v.length + 1) * ref.options.itemSize + 2 ) + ")")
        .call(ref.xAxis)
        .selectAll('text')
        .attr('font-weight', 'normal')
        .style("text-anchor", "start");

    // now add titles to the axes
    var movey = (ref.global_v.length + 1) * ref.options.itemSize;
    var movex = (ref.global_s.length + 1) * ref.options.itemSize;

    svg.append("text")
        .attr("text-anchor", "middle")  // this makes it easy to centre the text as the transform is applied to the anchor
        .attr("transform", "translate(" + (-ref.options.margin.left/2) + "," + (movex/2) + ")rotate(-90)")  // text is drawn off the screen top left, move down and out and rotate
        .text("Volume Factor");

    svg.append("text")
        .attr("text-anchor", "middle")  // this makes it easy to centre the text as the transform is applied to the anchor
        .attr("transform", "translate("+ (movex/2) + "," + (movey + (ref.options.margin.bottom / 2)) + ")")  // centre below axis
        .text("Space Factor");

    var data = this.gen_data(total_failure_rate, volume_min, space_min, phys_error_rate);
    d3.select('#plotsvg' + ref.plot_name.replace(".", "")).selectAll('rect')
        .data(data)
        .enter().append('g').append('rect')
        .attr('class', 'cell')
        .attr('width', ref.options.cellSize)
        .attr('height', ref.options.cellSize)
        .attr('y', function(d) { return ref.yScale_local(d.y); })
        .attr('x', function(d) { return ref.xScale_local(d.x); })
        .attr('fill', function(d) {return ref.color_interpretation(d);})
        .on('mouseover', handleMouseOver.bind(ref) );
}

Schneegloeckchen.prototype.gen_data = function(total_failure_rate, start_volume, start_space, p_err)
{
    // 2D Array
    var data = new Array();

    for (var i=0; i<this.global_v.length; i++)
    {
        for(var j=0; j < this.global_s.length; j++)
        {
            var space_param = approx_mult_factor(this.global_s[j], space_min);
            var ret_1 = calculate_total(this.estimation_method, volume_min, space_param, total_failure_rate, p_err);

            var vol_param = approx_mult_factor(this.global_v[i], volume_min);
            var ret_2 = calculate_total(this.estimation_method, vol_param, space_min, total_failure_rate, p_err);

            if ((ret_1 == "ERROR") || (ret_2 == "ERROR"))
            {
                console.log("SOMETHING WENT WRONG!!!");
            }

            var ratio = (ret_2["number_of_physical_qubits"])/ (ret_1["number_of_physical_qubits"]);

            data.push({
                x: this.global_s[j],
                y: this.global_v[i],
                dist_opt_vol : ret_1.dist,
                dist_opt_space : ret_2.dist,
                nr_target_vol : ret_1["number_of_physical_qubits"],
                nr_target_space : ret_2["number_of_physical_qubits"],
                ratio: ratio
            })
        }
    }

    return data;
}

Schneegloeckchen.prototype.color_interpretation = function(data)
{
    var component_green = data.ratio;
    var component_red = data.ratio;
    var component_blue = data.ratio;

    var analysis = paler_analysis(this.estimation_method, data);

    if(this.estimation_method == "a12")
    {
        component_blue = 128;
    }

    if (analysis.ok)
        component_green = 255;
    else
        component_red = 255;

    return "rgb(" + to_rgb(component_red) + "," + to_rgb(component_green) + "," + to_rgb(component_blue) + ")";
}
