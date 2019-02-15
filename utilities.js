/*
Utility functions
*/

// use for better axis formating
var superscript = "⁰¹²³⁴⁵⁶⁷⁸⁹";
var formatPower = function(d) { return (d + "").split("").map(function(c) { return superscript[c]; }).join(""); };
var formatTick = function(d) { return 10 + (d < 0 ? "⁻":"") + formatPower(Math.round(Math.log(d) / Math.LN10)); };

function approx_mult_factor(factor, value)
{
    // return Math.round(factor * value)
    return Math.ceil(factor * value);
}

function local_logspace(start, stop, num=50)
{
    //assume base = 10
    var ret = new Array(num);
    
    var delta = (stop - start)/num;
    for(var i=0; i<num; i++)
    {
        ret[i] = Math.pow(10, start + delta * i);
    }
    
    return ret;
}

function local_linspace(start, stop, num=50)
{
    var ret = new Array(num);
    
    var delta = (stop - start)/num;
    for(var i=0; i<num; i++)
    {
        ret[i] = start + delta * i;
    }
    
    return ret;
}

function create_2d_array(dim1, dim2)
{
    var ret = new Array(dim1);
    for(var i=0; i<dim1; i++)
    {
        ret[i] = new Array(dim2);
    }
    return ret;
}

var local_factorial_cache = {};
function local_factorial (n)
{
    if (n == 0 || n == 1)
    {
        return 1;
    }
    if (local_factorial_cache[n+""] > 0)
    {
        return local_factorial_cache[n+""];
    }
    
    var part = 1;
    for(var fn = 2; fn <=n; fn++)
    {
        if (local_factorial_cache[fn+""] > 0)
        {
            part = local_factorial_cache[fn+""];
        }
        else
        {
            part = part * fn;
            local_factorial_cache[fn+""] = part;
        }
    } 
    local_factorial_cache[n+""] = part;
    
    return local_factorial_cache[n+""];
}

// precompute values in cache
local_factorial(100);

function to_rgb(param)
{
    var ret = (param > 1 ? 255 : Math.round(param * 255));
    return ret;
}

function from_rgb(param)
{
    var ret = (param == 255 ? 2 : param / 255);
    return ret;
}

function create_description(elem_name, text)
{
    // this.explanation = "Given a fixed number of physical qubits, what is the total success probability? The higher the probability the lighter color.";

    var desc = document.createElement("div");

    desc.appendChild(document.createTextNode(text));
    desc.appendChild(document.createElement("br"));
    desc.setAttribute("class", "description");
    
    var alink = document.createElement("a");
    alink.setAttribute("href", "#");
    alink.setAttribute("onclick", "save_as_svg(\"" + elem_name + "\")");
    alink.innerHTML = "Download SVG";
    desc.appendChild(alink);

    var container = document.getElementsByClassName(elem_name)[0];
    container.appendChild(desc);
}

function create_parameter(elem_name, param_name, param_default_value)
{
    var container = document.getElementsByClassName(elem_name)[0];

    container.appendChild(document.createElement("br"));

    var divcont = document.createElement("div");
    divcont.setAttribute("class", "description");
    divcont.appendChild(document.createTextNode(param_name));

    var input = document.createElement("input");
    input.setAttribute("onchange", "update_plots()");
    input.setAttribute("type", "number");
    input.setAttribute("step", "1");
    input.setAttribute("id", elem_name + "_" + param_name);
    input.setAttribute("value", param_default_value);

    divcont.appendChild(input);
    container.appendChild(divcont);
}