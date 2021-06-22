class Info {
  constructor(name, target, property ) {
    this.name       = name;
    this.target     = target;
    this.property   = property;
  }
}

class Resource {
  constructor(name, target, used, available, util ) {
    this.name       = name;
    this.target     = target;
    this.used       = used;
    this.available  = available;
    this.util       = util;
  }

  // Methods
  getUtilization() {
    return parseFloat(this.util)
  }
}

class HieararhicResource {
  constructor(total_luts, logic_luts, lutrams, srls, ffs , ramb36 , ramb18 , dsp ) {
    this.total_luts         = total_luts;
    this.logic_luts         = logic_luts;
    this.lutrams            = lutrams;
    this.srls               = srls;
    this.ffs                = ffs;
    this.ramb36             = ramb36;
    this.ramb18             = ramb18;
    this.dsp                = dsp;
  }

  // Methods
  getUtilization() {
    return parseFloat(this.util)
  }
}

document.getElementById("parse_button").addEventListener("click", Parse, false);
document.getElementById("input").addEventListener("change", updateFileTable, false);
const inputElement = document.getElementById("input");

var UtilTargets = [
  ['|Date:'           , 'Build Time',    'info'],
  ['|ToolVersion:'    , 'Tool Version',  'info'],
  ['|Host:'           , 'Host Machine',  'info'],
  ['|Design:'         , 'Design Name',   'info'],
  ['|Device:'         , 'Device',        'info'],
  ['|SliceLUTs|'      , 'LUT',           'rsrc'],
  ['|SliceRegisters|' , 'Register',      'rsrc'],
  ['|RAMB36/FIFO*|'   , 'RAMB36',        'rsrc'],
  ['|RAMB18|'         , 'RAMB18',        'rsrc'],
  ['|DSPs|'           , 'DSP',           'rsrc'],
  ['|BondedIOB|'      , 'I/O',           'rsrc'],
  ['|MMCME2_ADV|'     , 'MMCM',          'rsrc'],
  ['|PLLE2_ADV|'      , 'PLL',           'rsrc']
];

function updateFileTable()
{
    oFiles = this.files;
    nFiles = oFiles.length;

    var FilelistArray =[];

    for (var i=0; i<nFiles; i++)
    {
        var data = [];
        size=Math.ceil(oFiles[i].size/1024)

            data.push(oFiles[i].name);
            data.push(size.toString().concat("KB"));

        FilelistArray.push(data);

    }

    document.getElementById("file_table").innerHTML = makeFilelistTable(FilelistArray)
}

function makeFilelistTable(myArray) {
    var result = "<table border=0>";
    for(var i=0; i<myArray.length; i++)
    {
        result += "<tr>";
        for(var j=0; j<myArray[i].length; j++)
        {
            if(j==1)
              result += '<td  style="text-align:right">' + myArray[i][j] + '</td>';
            else
              result += "<td>"+myArray[i][j]+"</td>";
        }
        result += "</tr>";
    }
    result += "</table>";

    return result;
}

function makeHierResourceTable(hier_util_types ,tree_struct) {
    var result = '<table border=0 class="hier_resrc_table">';

    result += "<tr>";
    for(let i=0; i<hier_util_types.length; i++)
    {
            result += "<td>" + hier_util_types[i] + "</td>";
    }
    result += "</tr>";

    tree_struct.walk({strategy: 'pre'},
        function (node) {
            result += "<tr>";
            for(let i=0; i<node.model.values.length; i++)
            {
                if(i==0)
                    result += "<td>" +  "&nbsp".repeat(node.model.ws_num) + node.model.values[i] + '</td>';
                else
                    result += "<td>" + node.model.values[i] + "</td>";
            }

            result += "</tr>";
        }
    );

    result += "</table>";

    return result;
}

function getWhiteSpaces(line) {
    if(line[0] != '|'){
        return 0
    }

    var ws_num = 0
    for(let i=1; i<line.length; i++)
    {
        if(line[i] != ' '){
            return ws_num
        }
        else{
            ws_num++
        }


    }

}

function Parse(){
    const fileList          = inputElement.files
    console.log(fileList)
    var reader_util         = new FileReader();
    reader_util.onload      = function(e) {
        let file_content        = e.target.result
        let file_lines          = file_content.split('\n')//Split file into array of lines
        let file_content_no_ws  = file_content.replace(/ /g, ""); //Remove whitespaces from file
        let file_lines_no_ws    = file_content_no_ws.split('\n')//Split file into array of lines
        var InfoArray       = []
        var ResourceArray   = []

        for (var i=0; i<file_lines_no_ws.length; i++){
            for (var k=0; k<UtilTargets.length; k++){
                if(file_lines_no_ws[i].includes(UtilTargets[k][0])){
                line_parts       = file_lines[i].split('|')
                line_parts_no_ws = file_lines_no_ws[i].split('|')

                    if(UtilTargets[k][2] == 'info'){
                        let property = line_parts[1].substring(line_parts[1].indexOf(":") + 1)
                        let item = new Info(UtilTargets[k][1], UtilTargets[k][0], property);
                        InfoArray.push(item)
                    }
                    else if(UtilTargets[k][2] == 'rsrc'){
                    let item = new Resource(UtilTargets[k][1], UtilTargets[k][0], line_parts_no_ws[2], line_parts_no_ws[4], line_parts_no_ws[5]);
                    ResourceArray.push(item)
                    }

                //console.table(UtilTargets)
                UtilTargets.splice(k,1)//Remove search target from array to avoidmultiple entries
                }
            }
        }

        document.getElementById("info_table").innerHTML = makeInfoTable(InfoArray)
        document.getElementById("resource_table").innerHTML = makeResourceTable(ResourceArray)
        document.getElementById('utilizChart').height = 600;

        console.log(InfoArray)
        console.table(ResourceArray)

        const data = {
            labels: getResourceNames(ResourceArray),
            datasets: [{
            label: 'Utilized FPGA resources',
            backgroundColor: 'rgb(156, 208, 255)',
            borderColor: 'rgb(0, 0, 0)',
            data: getResourceUtilization(ResourceArray)
            }]
        }

        const config = {
            type: 'bar',
            data,
            options: {
                responsive: false,
                scales: {
                    xAxes: [{
                        ticks: {
                            fontSize: 40
                        }
                    }],

                    yAxes: [{
                        ticks: {
                            fontSize: 40
                        }
                    }]
                }
            }
        }

        var myChart = new Chart( document.getElementById('utilizChart'),config);

    }

    var reader_hier_util        = new FileReader();
    reader_hier_util.onload     = function(e) {
        let file_content        = e.target.result
        let file_lines          = file_content.split('\n')//Split file into array of lines
        let file_content_no_ws  = file_content.replace(/ /g, ""); //Remove whitespaces from file
        let file_lines_no_ws    = file_content_no_ws.split('\n')//Split file into array of lines


        for (let i=0; i<file_lines_no_ws.length; i++){
            if(file_lines_no_ws[i].includes('|Instance|Module|')){
                var hier_util_types = file_lines[i].split('|')
                hier_util_types = hier_util_types.slice(1,hier_util_types.length-1)
                var root_line_index = i + 2
            }
        }

        root_values = file_lines_no_ws[root_line_index].split('|')
        root_values = root_values.slice(1,root_values.length-1)
        ws_num      = getWhiteSpaces(file_lines[root_line_index])

        tree = new TreeModel()
        root = tree.parse({name: 'root', ws_num: ws_num, values: root_values,  children: []})

        current_node = root
        iter_cntr = 0
        for (let i=root_line_index+1; i<file_lines.length; i++){
            iter_cntr ++
            ws_num = getWhiteSpaces(file_lines[i])
            if(ws_num == 0)
                break

            node_values = file_lines_no_ws[i].split('|')
            node_values = node_values.slice(1,node_values.length-1)
            node = tree.parse({name: 'leaf_' + iter_cntr.toString(), ws_num: ws_num, values: node_values,  children: []})
            if(current_node.model.ws_num < ws_num){
                current_node.addChild(node);
            }
            else if(current_node.model.ws_num == ws_num){
                current_node.parent.addChild(node);
            }
            else if(current_node.model.ws_num > ws_num){
                current_node.parent.parent.addChild(node);
            }
            current_node = node



        }
        console.log(root)
        //Visualise the data structure
        document.getElementById("hier_resrc_table").innerHTML = makeHierResourceTable(hier_util_types, root)
    }

    for (var i=0;i<fileList.length;i++)
    {
        if(fileList[i].name.includes('_utilization_placed.rpt')){
            reader_util.readAsText(fileList[i])

        }

        if(fileList[i].name.includes('_utilization_placed_hierarchical.rpt')){
            reader_hier_util.readAsText(fileList[i])

        }
    }
}

function getResourceNames(myArray){
    names =[]
    names.push(' ') //Empty bar
    for(var i=0; i<myArray.length; i++)
    {

        names.push(myArray[i].name)

    }
    return names
}

function getResourceUtilization(myArray){
    utilization =[]
    utilization.push(0.0) //Empty bar
    for(var i=0; i<myArray.length; i++)
    {

        utilization.push(myArray[i].getUtilization())

    }
    return utilization
}

function makeInfoTable(myArray) {
    var result = '<table border=0 class="table_info">';
    for(var i=0; i<myArray.length; i++)
    {
        result += "<tr>";
        result += "<td>" + myArray[i].name + "</td>";
        result += "<td>"+ myArray[i].property + "</td>";
        result += "</tr>";
    }
    result += "</table>";
    return result;
}

function makeResourceTable(myArray) {
    var result = '<table border=0 class="table_resource">';
    result += "<tr>";
    result += "<td>" + "Resource Category" + "</td>";
    for(var i=0; i<myArray.length; i++){

        result += "<td>" + myArray[i].name + "</td>";

    }
    result += "</tr>";

    result += "<tr>";
    result += "<td>" + "Used/All" + "</td>";
    for(var i=0; i<myArray.length; i++){
      result += "<td>" + myArray[i].used + " / " + myArray[i].available + "</td>";

    }
    result += "</tr>";

    result += "<tr>";
    result += "<td>" + "Utilization" + "</td>";
    for(var i=0; i<myArray.length; i++){
        result += "<td>" + myArray[i].util + "%"+ "</td>";

    }
    result += "</tr>";

    result += "</table>";
    return result;
}




