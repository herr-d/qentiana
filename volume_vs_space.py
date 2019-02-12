import math
import numpy as np

#plotting
# from bokeh.plotting import figure, save, output_file
# from bokeh.layouts import row, column
# from bokeh.models.widgets import Slider
# from bokeh.models import Legend, CustomJS, ColumnDataSource
# from bokeh.io import curdoc
# from bokeh.io import export_svgs


def logical_error_probability(d, p_step):
    # use equation from fowlers paper on logical error rate
    tmp = d*math.factorial(d) / (math.factorial(int((d+1)/2) - 1)
        * math.factorial(int((d+1)/2)))
    return tmp * p_step**int(d+1)/2


def calc_distance(p_err_out, p_step, spacetime_volume,
    min_dist = 3, max_dist = 50):
    """
    Find the lowest distance for which the error rate of the whole circuit
    is given by less than p_err_out. Given an error rate per step of p_step.  
    """
    for d in range(min_dist, max_dist):
        if(p_err_out > 1 - (1-logical_error_probability(d,p_step))**spacetime_volume):
            return d
    raise RuntimeError("Could not find a suitable distance")

def logical_error_from_volume(volume, total_failure_rate):
    return total_failure_rate**(1./volume)


def number_of_physical_qubits(distance, space):
    # only looking at data qubits
    return space*distance*distance

def calculate_total(volume, space, total_failure_rate, p_step_err = 0.02):
    P_1 = logical_error_from_volume(volume, total_failure_rate)
    dist = calc_distance(P_1, p_step_err, volume)
    return dist, number_of_physical_qubits(dist, space)




def RGB_map(data):
    """
    maps values to color
    """
    # data > 1 -> volume optimized is better than space optimized
    if data > 1:
        return 255,255,255 # RED, GREEN, BLUE
    else: # gray area space optimized is better
        add = int(data*200)
        return (add, add, add) # RED, GREEN, BLUE


def single_frame():
    return

# def plot_data(v,s,data):
#     global img, p, source
#     img = np.empty((len(v),len(s)), dtype=np.uint32)
#     view = img.view(dtype=np.uint8).reshape((len(v), len(s), 4))

#     # i is vertical coordinate
#     # j is horizontal coordinate
#     for i in range(len(v)):
#         for j in range(len(s)):
#             view[i, j, 0], view[i, j, 1], view[i, j, 2] = RGB_map(data[i,j]);
#             view[i, j, 3] = 180 # ALPHA

#     p = figure(plot_height=400, plot_width=400, x_range=(s[0],s[-1]), y_range=(v[0],v[-1]), y_axis_type="log")

#     source = ColumnDataSource({'image': [img]})
#     p.image_rgba(image='image', x=s[0], y=v[0], dw=s[-1]-s[0], dh=v[-1]-v[0],source = source)
    
#     # styling
#     p.title.text = 'Total Qubit Overhead: volume-optimal vs space-optimal'
#     p.xaxis.axis_label = 'space-optimal factor'
#     p.yaxis.axis_label = 'volume-optimal factor'

#     # no toolbar and logo
#     p.toolbar.logo = None
#     p.toolbar_location = None

#     # legend
#     items = []
#     items += [("space-optimal has fewer qubits",[p.circle(i,i,color="gray",size=20)])]
#     items += [("volume-optimal has fewer qubits",[p.circle(i,i,color="white",size=20)])]
#     p.add_layout(Legend(items=items))
#     p.legend.location = "bottom_right"


#     #slider error rate
#     #callback = CustomJS(args=dict(p=p), code="""p.reset.emit()""")
#     #callback = CustomJS(args=dict(p=p), code=""" """)
#     error_rate = Slider(title = "per cycle error", value=0.001, start=0.001, end=0.02, step=0.001, format="0[.]000")#,callback=callback)
#     error_rate.on_change('value',update_error)

#     #slider min_volume
#     min_volume_slider = Slider(title = "min_volume", value=23*11, start=100, end=10000, step=100, format="0")#,callback=callback)
#     min_volume_slider.on_change('value',update_volume)

#     #slider min_space
#     min_space_slider = Slider(title = "min_space", value=7, start=5, end=500, step=5, format="0")#,callback=callback)
#     min_space_slider.on_change('value',update_space)

#     #layout
#     inputs = column(error_rate,min_volume_slider, min_space_slider)
#     curdoc().add_root(row(inputs, p, width=800))
#     curdoc().title = "Total Qubit Overhead: volume-optimal vs space-optimal"
#     return


def gen_data(total_failure_rate, volume_min, space_min, p_err):
    data = np.zeros((len(v),len(s)))
    for i in range(len(v)):
        for j in range(len(s)):
            dist1, physicalqubits1 = calculate_total(volume_min, int(space_min*s[j]+0.5), total_failure_rate, p_err)
            dist2, physicalqubits2 = calculate_total(int(volume_min*v[i]+0.5), space_min, total_failure_rate, p_err)
            data[i,j] = physicalqubits2/physicalqubits1
    return data

def update_error(attrname,old,new):
    global total_failure_rate,volume_min,space_min,phys_error_rate
    phys_error_rate = new
    update_data()
    return


def update_space(attrname,old,new):
    global total_failure_rate,volume_min,space_min,phys_error_rate
    space_min = new
    update_data()
    return


def update_volume(attrname,old,new):
    global total_failure_rate,volume_min,space_min,phys_error_rate
    volume_min = new
    update_data()
    return

def update_data():
    global p, img, source, total_failure_rate,volume_min,space_min,phys_error_rate

    data = gen_data(total_failure_rate,volume_min,space_min, phys_error_rate)

    view = img.view(dtype=np.uint8).reshape((len(v), len(s), 4))

    # i is vertical coordinate
    # j is horizontal coordinate
    for i in range(len(v)):
        for j in range(len(s)):
            view[i, j, 0], view[i, j, 1], view[i, j, 2] = RGB_map(data[i,j]);
            view[i, j, 3] = 180 # ALPHA
    source.data = {'image': [img]}
    return


# parameters:
total_failure_rate = 0.01
# data for minimum values
volume_min = 23*11
space_min = 7
phys_error_rate = 0.001

img = None # storage for image
p = None # figure
source = None # storage for image in figure

# generate parameter space for scaling factors
#v = np.linspace(1, 400,100) # scaling factor volume
v = np.logspace(0,6,100) # log spaced volume scaling factor
s = np.linspace(1,3,100) # scaling factor space
#dist1, physicalqubits1 = calculate_total(volume1, space1, total_failure_rate)
data = gen_data(total_failure_rate, volume_min, space_min, phys_error_rate)
plot_data(v,s,data)
