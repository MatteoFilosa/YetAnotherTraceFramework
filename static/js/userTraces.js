//#region Global Variables
var tracesNum;
var selectedTraces = new Set();
var loadedTraces;
var violationsForAllTraces;
var timeForAllTraces;
var selectedTraceID;
var selectedTrace_RawValue;
var maxInteractionsValue, maxTotalTimeValue, maxViolationsValue;
var globalViolationsData = [];
var filtersContainer;
var demographicData;
//#endregion

window.onload = function () {
  filtersContainer = document.getElementById("filtersContainer");
  loadingIcon = document.getElementById("loadingIcon");
  table = document.getElementById("table");

  //document.getElementById("colorLegend").classList.add("userTracesLegend");
  colorLegend();
  getViolations();
  getTime();
  getUserTraces();

  document
    .getElementById("selectAllCheckbox")
    .addEventListener("change", function () {
      const tableBody = document.getElementById("tracesTable");

      const checkboxes = document.querySelectorAll(
        "#tracesTable input[type='checkbox']"
      );
      const selectAllCheckbox = document.getElementById("selectAllCheckbox");

      checkboxes.forEach((checkbox) => {
        checkbox.checked = selectAllCheckbox.checked;

        const row = checkbox.closest("tr");
        if (checkbox.checked) {
          row.classList.add("table-selected");
          selectedTraces.add(checkbox.id);
        } else {
          row.classList.remove("table-selected");
          selectedTraces.delete(checkbox.id);
        }
      });
      if (selectedTraces.size != 0) {
        document.getElementById("selectTraceBtn").style.display = "block";
        document.getElementById(
          "selectTraceBtn"
        ).innerHTML = `Replay ${selectedTraces.size} traces`;
      } else {
        document.getElementById("selectTraceBtn").style.display = "none";
      }
    });
};

function createCheckboxes() {
  for (let i = 1; i <= tracesNum; i++) {
    console.log(typeof(String(i)))
    findViolations(String(i)).then(violationsTmp => {
      globalViolationsData.push({
        user: String(i),
        violations: violationsTmp
      });
    });
  }

  console.log(globalViolationsData)

  var violationFilterDiv = document.createElement("div");
  // // Creazione del label "Violation types"
  // var labelViolationTypes = document.createElement("label");
  // labelViolationTypes.textContent = "Violation types";
  // violationFilterDiv.appendChild(labelViolationTypes);

  var checkboxLabels = ["Low", "Medium", "High", "Critical"];

  var horizontalDiv = document.createElement("div");
  horizontalDiv.style.display="flex";
  horizontalDiv.style.width="250px";
  horizontalDiv.style.justifyContent="space-between";
  
  for (var i = 0; i < checkboxLabels.length; i++) {
    let containerDiv = document.createElement("div");
    containerDiv.style.display="flex";
    var checkbox = document.createElement("input");
    checkbox.style.marginLeft="10px";
    checkbox.type = "checkbox";
    checkbox.id = "checkbox" + (i + 1);

    var label = document.createElement("label");
    label.style.marginLeft="10px";
    label.style.marginBottom="0px";
    label.textContent = checkboxLabels[i];
    label.setAttribute("for", "checkbox" + (i + 1));

    containerDiv.appendChild(checkbox);
    containerDiv.appendChild(label);
    
    document.getElementById("violationsDropdown").appendChild(containerDiv);
    checkbox.addEventListener("change", applyCheckboxFilter);
  }
  // violationFilterDiv.appendChild(horizontalDiv);
  filtersContainer.appendChild(violationFilterDiv);

} 

function applyCheckboxFilter() {
  // Get values selected from checkboxes
  const checkbox1Checked = document.getElementById("checkbox1").checked;
  const checkbox2Checked = document.getElementById("checkbox2").checked;
  const checkbox3Checked = document.getElementById("checkbox3").checked;
  const checkbox4Checked = document.getElementById("checkbox4").checked;

  // Get values from sliders
  const violationsFilterValue = parseFloat(document.getElementById("violationsSlider").value);
  const eventsFilterValue = parseFloat(document.getElementById("interactionsSlider").value);
  const totalTimeFilterValue = parseFloat(document.getElementById("totalTimeSlider").value);

  // Get values selected from demographic filters
  const selectedAge = document.getElementById('AgeFilter').value;
  const selectedGender = document.getElementById('GenderFilter').value;
  const selectedStudyTitle = document.getElementById('StudyTitleFilter').value;

  // Define selectedLevels array
  const selectedLevels = [];

  // Add selected levels to the array
  if (checkbox1Checked) selectedLevels.push("level1");
  if (checkbox2Checked) selectedLevels.push("level2");
  if (checkbox3Checked) selectedLevels.push("level3");
  if (checkbox4Checked) selectedLevels.push("level4");

  // Loop through table rows
  const tableRows = document.getElementById("tracesTable").getElementsByTagName("tr");
  let visibleRowCount = 0;

  for (let i = 0; i < tableRows.length; i++) {
    const row = tableRows[i];

    // Get values from children using specified ids
    const violationsValue = parseFloat(row.querySelector("#violationsCell").innerHTML);
    const eventsValue = parseFloat(row.querySelector("#eventCell").innerHTML);
    var totalTimeValue = parseFloat(row.querySelector("#timeCell").innerHTML);

    // Get ID from the row
    const userIDElement = row.querySelector(".sorting_1");
    const rowID = userIDElement ? userIDElement.innerHTML : null;

    // Cerca le informazioni demografiche per l'utente corrente
    const userDemographicInfo = demographicData.find(item => item.User === rowID);

    // Check if the ID has at least one violation for each selected level
    const showRow =
      hasViolationsLevel(rowID, selectedLevels) &&
      (!selectedAge || userDemographicInfo.Age === selectedAge) &&
      (!selectedGender || userDemographicInfo.Gender === selectedGender) &&
      (!selectedStudyTitle || userDemographicInfo['Study Title'] === selectedStudyTitle) &&
      !isNaN(violationsValue) &&
      !isNaN(eventsValue) &&
      !isNaN(totalTimeValue) &&
      violationsValue <= violationsFilterValue &&
      eventsValue <= eventsFilterValue &&
      totalTimeValue <= totalTimeFilterValue;

    // Show/hide row based on checkbox and slider filters
    row.style.display = showRow ? "" : "none";

    // Increment count of visible rows
    if (showRow) {
      visibleRowCount++;
    }
  }

  // Update innerHTML of "tracesNum" element
  document.getElementById("tracesNum").innerHTML = "Loaded User Traces: " + visibleRowCount;
}

// Function to check if an ID has at least one violation for each specified level
function hasViolationsLevel(userID, levels) {
  // Search for the user in globalViolationsData
  const userData = globalViolationsData.find(data => data.user === userID);

  // If the user is not found, return false
  if (!userData) {
    return false;
  }

  // Check if the user has at least one violation for each specified level
  return levels.every(level => userData.violations[level] > 0);
}

function createSliders() {
  // maxViolationsValue
  const violationsSlider = createSlider("violationsSlider", "Total Violations", maxViolationsValue);

  // maxInteractionsValue
  const interactionsSlider = createSlider("interactionsSlider", "Events", maxInteractionsValue);

  // maxTotalTimeValue
  const totalTimeSlider = createSlider("totalTimeSlider", "Time", maxTotalTimeValue);

  // Add sliders
  document.getElementById("violationsFilter").appendChild(violationsSlider);
  document.getElementById("eventsFilter").appendChild(interactionsSlider);
  document.getElementById("totalTimeFilter").appendChild(totalTimeSlider);

  // Add the other two checkboxes (violation types, task division), can be done later

  // We need to add a function for filtering the table
}

function createSlider(id, label, maxValue) {
  const sliderContainer = document.createElement("div");

  // Create label for the slider
  /* const labelElement = document.createElement("label");
  labelElement.textContent = label;
  sliderContainer.appendChild(labelElement); */

  if (id === "totalTimeSlider") {
    maxValue = Math.ceil(maxValue);
  }
  // Create slider
  const slider = document.createElement("input");
  slider.style.accentColor = "#554e8d";
  slider.type = "range";
  slider.min = 0;
  slider.max = maxValue;
  slider.value = maxValue;
  slider.id = id;

  // Create element to display current value
  const valueDisplay = document.createElement("span");
  valueDisplay.textContent = maxValue;

  // Append slider and value display to the container
  sliderContainer.appendChild(slider);
  sliderContainer.appendChild(valueDisplay);

  //sliderContainer.setAttribute("data-filter", dataFilter);

  // Attach an event listener to update the displayed value when the slider changes
  slider.addEventListener("input", () => {
    valueDisplay.textContent = slider.value;
    applyTableFilter();
  });

  return sliderContainer;
}

function applyTableFilter() {
  // Get values from sliders
  const violationsFilterValue = document.getElementById("violationsSlider").value;
  const eventsFilterValue = document.getElementById("interactionsSlider").value;
  const totalTimeFilterValue = parseFloat(document.getElementById("totalTimeSlider").value);

  // Get values selected from checkboxes
  const checkbox1Checked = document.getElementById("checkbox1").checked;
  const checkbox2Checked = document.getElementById("checkbox2").checked;
  const checkbox3Checked = document.getElementById("checkbox3").checked;
  const checkbox4Checked = document.getElementById("checkbox4").checked;

  // Get values selected from demographic filters
  const selectedAge = document.getElementById('AgeFilter').value;
  const selectedGender = document.getElementById('GenderFilter').value;
  const selectedStudyTitle = document.getElementById('StudyTitleFilter').value;

  // Check if at least one checkbox is selected
  const anyCheckboxChecked = checkbox1Checked || checkbox2Checked || checkbox3Checked || checkbox4Checked;

  // Loop through table rows
  const tableRows = document.getElementById("tracesTable").getElementsByTagName("tr");
  let visibleRowCount = 0;

  for (let i = 0; i < tableRows.length; i++) {
    const row = tableRows[i];

    // Get values from children using specified ids
    const violationsValue = parseFloat(row.querySelector("#violationsCell").innerHTML);
    const eventsValue = parseFloat(row.querySelector("#eventCell").innerHTML);
    var totalTimeValue = parseFloat(row.querySelector("#timeCell").innerHTML);

    // Get ID from the row
    const userIDElement = row.querySelector(".sorting_1");
    const rowID = userIDElement ? userIDElement.innerHTML : null;

    // Cerca le informazioni demografiche per l'utente corrente
    const userDemographicInfo = demographicData.find(item => item.User === rowID);

    // Check if at least one checkbox is selected or if all are unticked
    const checkboxFilterCondition = !anyCheckboxChecked ||
      ((checkbox1Checked && hasViolationsLevel(rowID, ["level1"])) ||
        (checkbox2Checked && hasViolationsLevel(rowID, ["level2"])) ||
        (checkbox3Checked && hasViolationsLevel(rowID, ["level3"])) ||
        (checkbox4Checked && hasViolationsLevel(rowID, ["level4"])));

    // Check if the ID has at least one violation for each selected level and satisfies slider filters
    const showRow =
      !isNaN(violationsValue) &&
      !isNaN(eventsValue) &&
      !isNaN(totalTimeValue) &&
      violationsValue <= violationsFilterValue &&
      eventsValue <= eventsFilterValue &&
      totalTimeValue <= totalTimeFilterValue &&
      checkboxFilterCondition &&
      (!selectedAge || userDemographicInfo.Age === selectedAge) &&
      (!selectedGender || userDemographicInfo.Gender === selectedGender) &&
      (!selectedStudyTitle || userDemographicInfo['Study Title'] === selectedStudyTitle);

    // Show/hide row based on the filter
    row.style.display = showRow ? "" : "none";

    // Increment count of visible rows
    if (showRow) {
      visibleRowCount++;
    }
  }

  // Update innerHTML of "tracesNum" element
  document.getElementById("tracesNum").innerHTML = "Loaded User Traces: " + visibleRowCount;
}

function createDemographicFilter(data) {
  demographicData = data;

  // Get unique values for age, gender, and study title
  const uniqueAges = [...new Set(demographicData.map(item => item.Age))].sort((a, b) => ageSortOrder.indexOf(a) - ageSortOrder.indexOf(b));
  const uniqueGenders = [...new Set(demographicData.map(item => item.Gender))].sort((a, b) => genderSortOrder.indexOf(a) - genderSortOrder.indexOf(b));

  // Define the order for study titles directly
  const uniqueStudyTitles = ['High School', 'Bachelor Degree', 'Master Degree', 'PhD'];

  // Create filter for age
  const ageFilter = createSelectFilter('AgeFilter', 'Age', uniqueAges);
  document.getElementById('demographicFilter').appendChild(ageFilter);

  // Create filter for gender
  const genderFilter = createSelectFilter('GenderFilter', 'Gender', uniqueGenders);
  document.getElementById('demographicFilter').appendChild(genderFilter);

  // Create filter for study title
  const studyTitleFilter = createSelectFilter('StudyTitleFilter', 'Study Title', uniqueStudyTitles);
  document.getElementById('demographicFilter').appendChild(studyTitleFilter);

  // Add listener to filter elements to apply the filter function
  ageFilter.addEventListener('change', applyDemographicFilter);
  genderFilter.addEventListener('change', applyDemographicFilter);
  studyTitleFilter.addEventListener('change', applyDemographicFilter);
}

// No need for studyTitleSortOrder in this case
const ageSortOrder = ['18-24', '25-34', '35-44', '45-54'];
const genderSortOrder = ['Male', 'Female', 'Other', 'Prefer not to say'];



function createSelectFilter(id, label, options) {
  const selectContainer = document.createElement('div');

  // labels
  const labelElement = document.createElement('label');
  labelElement.textContent = label;
  selectContainer.appendChild(labelElement);

  
  const select = document.createElement('select');
  select.id = id;
  select.classList.add("form-select");

  options.forEach(optionValue => {
    const option = document.createElement('option');
    option.value = optionValue;
    option.text = optionValue;
    select.appendChild(option);
  });


  selectContainer.appendChild(select);

  return selectContainer;
}

function applyDemographicFilter() {

  const selectedAge = document.getElementById('AgeFilter').value;
  const selectedGender = document.getElementById('GenderFilter').value;
  const selectedStudyTitle = document.getElementById('StudyTitleFilter').value;

  // Get values from sliders
  const violationsFilterValue = parseFloat(document.getElementById("violationsSlider").value);
  const eventsFilterValue = parseFloat(document.getElementById("interactionsSlider").value);
  const totalTimeFilterValue = parseFloat(document.getElementById("totalTimeSlider").value);

  // Get values selected from checkboxes
  const checkbox1Checked = document.getElementById("checkbox1").checked;
  const checkbox2Checked = document.getElementById("checkbox2").checked;
  const checkbox3Checked = document.getElementById("checkbox3").checked;
  const checkbox4Checked = document.getElementById("checkbox4").checked;

  // Check if at least one checkbox is selected
  const anyCheckboxChecked = checkbox1Checked || checkbox2Checked || checkbox3Checked || checkbox4Checked;

  // Loop attraverso le righe della tabella
  const tableRows = document.getElementById('tracesTable').getElementsByTagName('tr');
  let visibleRowCount = 0;

  for (let i = 0; i < tableRows.length; i++) {
    const row = tableRows[i];

  
    const userIDElement = row.querySelector('.sorting_1');
    const rowID = userIDElement ? userIDElement.innerHTML : null;

    const userDemographicInfo = demographicData.find(item => item.User === rowID);


    const violationsValue = parseFloat(row.querySelector("#violationsCell").innerHTML);
    const eventsValue = parseFloat(row.querySelector("#eventCell").innerHTML);
    var totalTimeValue = parseFloat(row.querySelector("#timeCell").innerHTML);

    // All the filters considered
    const showRow =
      (!selectedAge || userDemographicInfo.Age === selectedAge) &&
      (!selectedGender || userDemographicInfo.Gender === selectedGender) &&
      (!selectedStudyTitle || userDemographicInfo['Study Title'] === selectedStudyTitle) &&
      (!isNaN(violationsValue) && violationsValue <= violationsFilterValue) &&
      (!isNaN(eventsValue) && eventsValue <= eventsFilterValue) &&
      (!isNaN(totalTimeValue) && totalTimeValue <= totalTimeFilterValue) &&
      (!anyCheckboxChecked ||
        ((checkbox1Checked && hasViolationsLevel(rowID, ["level1"])) ||
          (checkbox2Checked && hasViolationsLevel(rowID, ["level2"])) ||
          (checkbox3Checked && hasViolationsLevel(rowID, ["level3"])) ||
          (checkbox4Checked && hasViolationsLevel(rowID, ["level4"]))));

    // Hide/show row
    row.style.display = showRow ? '' : 'none';

   
    if (showRow) {
      visibleRowCount++;
    }
  }

  // "tracesNum"
  document.getElementById('tracesNum').innerHTML = 'Loaded User Traces: ' + visibleRowCount;
}



function getUserTraces() {
  const url = "http://127.0.0.1:5000/get_user_traces";
  fetch(url)
    .then((response) => response.json())
    .then((json) => {
      loadedTraces = json;
      tracesNum = json.length;
      loadingIcon.style.display = "none";
      filtersContainer.style.display="flex";
      table.style.display = "block";
      document.getElementById("tracesNum").innerHTML =
        "Loaded User Traces: " + tracesNum;
      populateTable(loadedTraces);

      
    })
    .then(() => {
      // Enable filtering for table
      var table = new DataTable("#table", {
        searching: false,
        columnDefs: [
          // exclude first and last row from filtering and sorting
          { orderable: false, targets: [0] },
        ],
        paging: false,
        order: [[1, "asc"]],
        orderCellsTop: true,
        fixedHeader: true,
      });

  
      //Filters creation
      createSliders(); 
      createCheckboxes();
      // Local JSON file
      fetch('/files/user_traces/demographic_info/demographic_info.json')
        .then(response => response.json())
        .then(data => {
          
          
          createDemographicFilter(data);
        });

    });
}

function getViolations() {
  const url = "http://127.0.0.1:5000/get_violations";
  fetch(url)
    .then((response) => response.json())
    .then((json) => {
      violationsForAllTraces = json;
    });
}
function getTime() {
  const url = "http://127.0.0.1:5000/get_userTraceTime";
  fetch(url)
    .then((response) => response.json())
    .then((json) => {
      timeForAllTraces = json;
    });
}

//#region Update Table
// Function to truncate a string and add ellipsis
function truncateString(str, maxLength) {
  return str.length > maxLength ? str.substring(0, maxLength) + " [...]" : str;
}
function populateTable(data) {
  const tableBody = document.getElementById("tracesTable");
  console.log(data)


  data.forEach((element, index) => {
    let match = element.name.match(/_(\d+)\.[a-zA-Z]+$/);
    // Extract the captured number from the file name
    let extractedNumber = match ? match[1] : null;

    const row = document.createElement("tr");

    // Add checkbox column
    const checkboxCell = document.createElement("td");
    checkboxCell.style.paddingLeft = "1%";
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.id = extractedNumber;
    checkboxCell.appendChild(checkbox);
    row.appendChild(checkboxCell);

    // Add Name column
    const nameCell = document.createElement("td");
    nameCell.textContent = extractedNumber;

    row.appendChild(nameCell);

    // Add Events column
    const eventsCell = document.createElement("td");
    var traceData = JSON.parse(element.user_trace);
    eventsCell.style.display = "flex";
    eventsCell.style.marginTop = "11px";
    eventsCell.style.justifyContent = "space-between";
    eventsCell.id = "eventCell";

    eventTypes(extractedNumber).then(function (value) {
      eventsCell.appendChild(createEventsBar(value));

      const interactionsValue = Object.values(value).reduce(
        (acc, count) => acc + count,
        0
      );



      if (interactionsValue > maxInteractionsValue || maxInteractionsValue === undefined) {
        maxInteractionsValue = interactionsValue;
      }
    });

    //console.log("Il valore più grande di interactionsValue è:", maxInteractionsValue);

    eventsCell.textContent = traceData.length;
    row.appendChild(eventsCell);

    findViolations(extractedNumber).then(function (value) {
      // Add violations column
      const violationsCell = document.createElement("td");
      //violationsCell.id = "violationsCell";

      console.log(value)

      const violationsValue = Object.values(value).reduce(
        (acc, count) => acc + count,
        0
      );

      // Aggiorna la variabile maxViolationsValue se violationsValue è maggiore
      if (violationsValue > maxViolationsValue || maxViolationsValue === undefined) {
        maxViolationsValue = violationsValue;
      }

      violationsCell.appendChild(createViolationsBar(value));
      row.appendChild(violationsCell);

      // Qui puoi usare il valore più grande di maxViolationsValue

    });

    findTotalTime(extractedNumber).then(function (value) {
      // Add time column
      const timeCell = document.createElement("td");
      timeCell.id = "timeCell"
      timeCell.textContent = value.totalTime;
      row.appendChild(timeCell);
      console.log(value.totalTime)
      if (parseFloat(value.totalTime) > maxTotalTimeValue || maxTotalTimeValue === undefined) {
        maxTotalTimeValue = parseFloat(value.totalTime);
      }
      // Add the row to the table
      tableBody.appendChild(row);
      
      console.log("maxInteractionsValue è:", maxInteractionsValue);
      console.log("maxViolationsValue è:", maxViolationsValue);
      console.log("maxTotalTime è:", maxTotalTimeValue);

    });

    checkbox.addEventListener("change", function () {
      var numbersOnlyID = checkbox.id;
      if (checkbox.checked) {
        row.classList.add("table-selected");
        selectedTraces.add(checkbox.id);
        console.log(selectedTraces);

        document.getElementById("selectTraceBtn").style.opacity = 1;
        ExtraInfo();

        // if (document.getElementById(`extrainfoDiv`).getAttribute("data-visible") === "false") {
        //   document.getElementById(`extrainfoDiv`).setAttribute("data-visible", "true");
        //   //document.getElementById(`extrainfoDiv`).setAttribute("data-activatedBy", numbersOnlyID);
        //   showExtraInformation(numbersOnlyID);
        // } else {
        //   const wasActivatedBy = document.getElementById(`extrainfoDiv`).getAttribute("data-activatedBy");
        //   // console.log(`Was activatedBy:${wasActivatedBy}, pressed by:${numbersOnlyID}`);
        //   if (wasActivatedBy != 0 && wasActivatedBy != numbersOnlyID) {

        //     document.getElementById(`extrainfoDiv`).setAttribute("data-activatedBy", numbersOnlyID);
        //     showExtraInformation(numbersOnlyID);
        //   } else {
        //     document.getElementById(`button${numbersOnlyID}`).classList.remove("expandButtonPressed");
        //     document.getElementById(`extrainfoDiv`).setAttribute("data-visible", "false");
        //     document.getElementById(`extrainfoDiv`).setAttribute("data-activatedBy", 0);
        //     clearExtraInformation();
        //   }
        // }

      }
      else {
        row.classList.remove("table-selected");
        selectedTraces.delete(checkbox.id);
        console.log(selectedTraces);
        if (document.getElementById(`previewTrace${selectedTraceID}`)) {
          document.getElementById(`previewTrace${selectedTraceID}`).id = "previewTrace";
        }
        document.getElementById(`previewTrace`).style.display = "none";
        
        // document.getElementById(`button${numbersOnlyID}`).classList.remove("expandButtonPressed");
        // document.getElementById(`extrainfoDiv`).setAttribute("data-visible", "false");
        // document.getElementById(`extrainfoDiv`).setAttribute("data-activatedBy", 0);
        if(selectedTraces.size>0)
          ExtraInfo();
        else
          clearExtraInformation();
      }
      if (selectedTraces.size != 0) {
        document.getElementById("selectTraceBtn").style.display = "block";
        if (selectedTraces.size > 1) {
          document.getElementById(
            "selectTraceBtn"
          ).innerHTML = `Replay ${selectedTraces.size} traces`;
        } else
          document.getElementById(
            "selectTraceBtn"
          ).innerHTML = `Replay ${selectedTraces.size} trace`;

      } else {
        document.getElementById("selectTraceBtn").style.opacity = 0;
      }
    });
  });


}

//#endregion

//#region Select Trace

function ExtraInfo(){
  document.getElementById("extrainfoContent").style.opacity = 1;
  document.getElementById("placeholderText").style.display = "none";

  //For now, preview only one selected trace
  if(selectedTraces.size==1){
    const [userNum] = selectedTraces;
    selectedTraceID = userNum;
    document.getElementById("traceInfoTitle").innerHTML = `Trace Information: User ${[userNum]}`;
    document.getElementById("previewTrace").style.display="block";

    document.getElementById("previewTrace").href="home";

    loadedTraces.forEach((element, index) => {
      let match = element.name.match(/_(\d+)\.[a-zA-Z]+$/);
      // Extract the captured number from the file name
      let extractedNumber = match ? match[1] : null;
  
      if (extractedNumber === userNum) {
        selectedTrace_RawValue = JSON.parse(element.user_trace);
        //console.log(selectedTrace_RawValue);
      }
    });

    localStorage.setItem("selectedTrace", JSON.stringify(selectedTrace_RawValue) )
    localStorage.setItem("selectedTraceID", JSON.stringify(userNum))
    document.getElementById("previewTrace").id+=userNum;

    generateHeatmap(selectedTraceID);


  eventTypes(selectedTraceID).then(function (value) {
    const eventsList = document.getElementById("eventsList");
    eventsList.innerHTML = "";
    var eventsTotal=0;
    for (const key in value) {
      if (value[key] > 0) {
        eventsTotal+=value[key];
        var eventElement = document.createElement("li");
        eventElement.textContent = `${key}: ${value[key]}`;
        if (key == "dblclick")
          eventElement.textContent = `Double click: ${value[key]}`;
        eventElement.style.textTransform = "capitalize";
        eventsList.append(eventElement);
      }
    }
    document.getElementById("eventsTotal").innerHTML=`Events: ${eventsTotal}`;
  });

  findViolations(selectedTraceID).then(function (value) {
    const violationsList = document.getElementById("violationsList");
    violationsList.innerHTML = "";

    var level1 = document.createElement("div");
    level1.style.display="flex";
    let level1colorDiv = document.createElement("div");
    level1colorDiv.classList.add("violationsColorDiv");
    level1colorDiv.style.backgroundColor="#c7c7c7";
    level1.append(level1colorDiv);
    level1.append("Low: " + value.level1);
    

    var level2 = document.createElement("div");
    level2.style.display="flex";
    let level2colorDiv = document.createElement("div");
    level2colorDiv.classList.add("violationsColorDiv");
    level2colorDiv.style.backgroundColor="#7f7f7f";
    level2.append(level2colorDiv);
    level2.append("Medium: " + value.level2);

    var level3 = document.createElement("div");
    level3.style.display="flex";
    let level3colorDiv = document.createElement("div");
    level3colorDiv.classList.add("violationsColorDiv");
    level3colorDiv.style.backgroundColor="#dbdb8d";
    level3.append(level3colorDiv);
    level3.append("High: " + value.level3);

    var level4 = document.createElement("div");
    level4.style.display="flex";
    let level4colorDiv = document.createElement("div");
    level4colorDiv.classList.add("violationsColorDiv");
    level4colorDiv.style.backgroundColor="#17becf";
    level4.append(level4colorDiv);
    level4.append("Critical: " + value.level4);


    violationsList.append(level1);
    violationsList.append(level2);
    violationsList.append(level3);
    violationsList.append(level4);
    //generateViolationsHeatmap(value);
  });
  findTotalTime(selectedTraceID).then(function (value) {
    const timeList = document.getElementById("timeList");
    timeList.innerHTML = "";
    var totalTime = document.createElement("li");
    totalTime.textContent = `Total time: ${value.totalTime} seconds`;
    var averageTime = document.createElement("li");
    averageTime.textContent = `Average time: ${value.averageTime} seconds`;

    timeList.append(totalTime);
    timeList.append(averageTime);
  });
  
  }
  else{
    let traces = Array.from(selectedTraces);
    traces=traces.sort();
    let selectedNums=traces.join(", ");
    document.getElementById("traceInfoTitle").innerHTML = `Trace Information: Users ${selectedNums}`;
    
    if(document.getElementById(`previewTrace${selectedTraceID}`)){
      document.getElementById(`previewTrace${selectedTraceID}`).id="previewTrace";
    }

    document.getElementById(`previewTrace`).style.display="none";
    
    let sumOfEventTypes = {};
    var i=0;
    traces.forEach(element => {
      eventTypes(element).then(function (value) {
        sumOfEventTypes[`trace${i}`]=value;
        //console.log(sumOfEventTypes);
        i++;
        if(i==selectedTraces.size)
          sumEventTypes(sumOfEventTypes);
      });
      
    });
    

  }
 
}
function showExtraInformation(userID) {
  //console.log(userID)
  selectedTraceID=userID;

  loadedTraces.forEach((element, index) => {
    let match = element.name.match(/_(\d+)\.[a-zA-Z]+$/);
    // Extract the captured number from the file name
    let extractedNumber = match ? match[1] : null;

    if (extractedNumber === userID) {
      selectedTrace_RawValue = JSON.parse(element.user_trace);
      //console.log(selectedTrace_RawValue);
    }
  });

  document.getElementById("placeholderText").style.display = "none";
  document.getElementById("previewTrace").style.display="block";

  document.getElementById("previewTrace").href="home";
  localStorage.setItem("selectedTrace", JSON.stringify(selectedTrace_RawValue) )
  localStorage.setItem("selectedTraceID", JSON.stringify(selectedTraceID))
  document.getElementById("previewTrace").id+=selectedTraceID;
  
  document.getElementById("extrainfoContent").style.opacity = 1;
  document.getElementById(
    "traceInfoTitle"
  ).innerHTML = `Trace Information: User ${selectedTraceID}`;

  generateHeatmap(selectedTraceID);
  eventTypes(selectedTraceID).then(function (value) {
    const eventsList = document.getElementById("eventsList");
    eventsList.innerHTML = "";
    for (const key in value) {
      if (value[key] > 0) {
        console.log(key, value)
        var eventElement = document.createElement("li");
        eventElement.textContent = `${key}: ${value[key]}`;
        if (key == "dblclick")
          eventElement.textContent = `Double click: ${value[key]}`;
        eventElement.style.textTransform = "capitalize";
        eventsList.append(eventElement);
      }
    }
  });

  findViolations(selectedTraceID).then(function (value) {
    console.log(typeof(selectedTraceID))
    const violationsList = document.getElementById("violationsList");
    violationsList.innerHTML = "";

    var level1 = document.createElement("div");
    level1.style.display="flex";
    let level1colorDiv = document.createElement("div");
    level1colorDiv.classList.add("violationsColorDiv");
    level1colorDiv.style.backgroundColor="#c7c7c7";
    level1.append(level1colorDiv);
    level1.append("Low: " + value.level1);
    

    var level2 = document.createElement("div");
    level2.style.display="flex";
    let level2colorDiv = document.createElement("div");
    level2colorDiv.classList.add("violationsColorDiv");
    level2colorDiv.style.backgroundColor="#7f7f7f";
    level2.append(level2colorDiv);
    level2.append("Medium: " + value.level2);

    var level3 = document.createElement("div");
    level3.style.display="flex";
    let level3colorDiv = document.createElement("div");
    level3colorDiv.classList.add("violationsColorDiv");
    level3colorDiv.style.backgroundColor="#dbdb8d";
    level3.append(level3colorDiv);
    level3.append("High: " + value.level3);

    var level4 = document.createElement("div");
    level4.style.display="flex";
    let level4colorDiv = document.createElement("div");
    level4colorDiv.classList.add("violationsColorDiv");
    level4colorDiv.style.backgroundColor="#17becf";
    level4.append(level4colorDiv);
    level4.append("Critical: " + value.level4);


    violationsList.append(level1);
    violationsList.append(level2);
    violationsList.append(level3);
    violationsList.append(level4);
    //generateViolationsHeatmap(value);
  });
  findTotalTime(selectedTraceID).then(function (value) {
    const timeList = document.getElementById("timeList");
    timeList.innerHTML = "";
    var totalTime = document.createElement("li");
    totalTime.textContent = `Total time: ${value.totalTime} seconds`;
    var averageTime = document.createElement("li");
    averageTime.textContent = `Average time: ${value.averageTime} seconds`;

    timeList.append(totalTime);
    timeList.append(averageTime);
  });

}


async function clearExtraInformation() {
  document.getElementById(`previewTrace`).style.display="none";
  document.getElementById("placeholderText").style.display = "block";
  document.getElementById("extrainfoContent").style.opacity = 0;
  document.getElementById("traceInfoTitle").innerHTML = "Trace Information   ";
  selectedTraceID=null;
}

//#endregion

//#region Extract trace info

function sumEventTypes(objectContainer) {
  // Initialize an object to store the summed values
  let summedObject = {};

  // Iterate over each object in the object container
  for (const objKey in objectContainer) {
      const obj = objectContainer[objKey];
      // Iterate over each key in the object
      for (const key in obj) {
          // Check if the key already exists in the summedObject
          if (summedObject.hasOwnProperty(key)) {
              // If the key exists, add the value from the current object to the summedObject
              summedObject[key] += obj[key] || 0; // Adding 0 if the property is undefined
          } else {
              // If the key doesn't exist, initialize it with the value from the current object
              summedObject[key] = obj[key];
          }
      }
  }
  var eventsTotal=0;
  const eventsList = document.getElementById("eventsList");
    eventsList.innerHTML = "";
    for (const key in summedObject) {
      if (summedObject[key] > 0) {
        eventsTotal+=summedObject[key];
        //console.log(key, value)
        var eventElement = document.createElement("li");
        eventElement.textContent = `${key}: ${summedObject[key]}`;
        if (key == "dblclick")
          eventElement.textContent = `Double click: ${summedObject[key]}`;
        eventElement.style.textTransform = "capitalize";
        eventsList.append(eventElement);
      }
    }
    document.getElementById("eventsTotal").innerHTML=`Events: ${eventsTotal}`;
}


async function eventTypes(userID) {
  var searchWords = [
    "mousemove",
    "click",
    "dblclick",
    "brush",
    "wheel",
    "mouseout",
    "mouseover",
    "mousedown",
    "mouseup",
    "Double Click",
    "facsimile back",
  ];
  var wordCount = {};

  // Initialize counts for all search words to zero
  searchWords.forEach(function (searchWord) {
    wordCount[searchWord] = 0;
  });
  loadedTraces.forEach((element, index) => {
    let match = element.name.match(/_(\d+)\.[a-zA-Z]+$/);
    // Extract the captured number from the file name
    let extractedNumber = match ? match[1] : null;

    if (extractedNumber === userID) {
      let traceData = JSON.parse(element.user_trace);
      
      traceData.forEach(function (obj) {
        Object.values(obj).forEach(function (value) {
          searchWords.forEach(function (searchWord) {
            if (String(value).includes(searchWord)) {
              wordCount[searchWord]++;
            }
          });
        });
      });
    }
  });

  return wordCount;
}
async function findTotalTime(userID) {
  const timeInfo = { totalTime: 0, averageTime: 0 };
  timeForAllTraces.forEach((element, index) => {
    let match = element.name.match(/_(\d+)\.[a-zA-Z]+$/);
    // Extract the captured number from the file name
    let extractedNumber = match ? match[1] : null;

    if (extractedNumber === userID) {
      const userTrace = JSON.parse(element.user_trace);
      //console.log(element.name, userTrace.total_time);
      var totalTimeInSeconds = (userTrace.total_time / 1000).toFixed(2); // Convert milliseconds to seconds
      timeInfo.totalTime = totalTimeInSeconds;
      var avgTimeInSeconds = (userTrace.total_average_time / 1000).toFixed(2); // Convert milliseconds to seconds
      timeInfo.averageTime = avgTimeInSeconds;
    }
  });
  return timeInfo;
}

async function findViolations(userID) {
 
  //console.log(userID)
  // Initialize level counters
  const levelCount = {
    level1: 0,
    level2: 0,
    level3: 0,
    level4: 0,
  };
  for (const element of violationsForAllTraces) {
    let match = element.name.match(/_(\d+)\.[a-zA-Z]+$/);
    // Extract the captured number from the file name
    let extractedNumber = match ? match[1] : null;
    //console.log(extractedNumber, userID)
    //console.log(extractedNumber,number);
    if (extractedNumber === userID) {
      const userTrace = JSON.parse(element.user_trace);
      
      // Iterate through the JSON data
      
      for (const key in userTrace) {
        var levelname = "level" + key;
        //levelCount[levelname]=userTrace[key].length;
        for (const violationString of userTrace[key]) {
          const match = violationString.match(/violation of level (\d+)/);
          if (match) {
            const level = `level${match[1]}`;
            // Increment the corresponding level counter
            levelCount[level]++;
          }
        }
      }
    }
  }
  /* globalViolationsData.push({
    userID: userID,
    violations: levelCount,
  }); */
  //console.log(levelCount)
  return levelCount;
}
//#endregion

function createViolationsBar(violations){
  
  const violationsRectangle = document.createElement("div");
  violationsRectangle.style.display="flex";
  violationsRectangle.style.width="100%";
  violationsRectangle.style.justifyContent="space-between";
  violationsRectangle.id = "violationsRectangle";
  violationsRectangle.innerHTML = "";

  
  // Calculate the percentage of each event type
  const totalViolations = Object.values(violations).reduce(
    (acc, count) => acc + count,
    0
  );
  
  var totalNum = document.createElement("p");
  totalNum.textContent=totalViolations;
  totalNum.style.marginRight="8px";
  totalNum.style.color="black";
  totalNum.id = "violationsCell"
  violationsRectangle.appendChild(totalNum);

  const percentages = {};
  for (const [violationName, count] of Object.entries(violations)) {
    percentages[violationName] = (count / totalViolations) * 100;
  }

  const sortedPercentages = Object.entries(violations)
    .map(([violationName, count]) => ({
      violationName,
      percentage: (count / totalViolations) * 100,
    }))
    .sort((a, b) => a.percentage - b.percentage);

  // Set a minimum width for the bar
  const minWidth = 10;

  // Create and append bars based on violation types
  let wrapperDiv = document.createElement("div");
  wrapperDiv.style.width = "80%";
  wrapperDiv.style.display = "flex";
  wrapperDiv.style.marginTop = "5px";

  for (const { violationName, percentage } of sortedPercentages) {
    // Check if the violation count is greater than 0
    if (violations[violationName] > 0) {
      const eventDiv = document.createElement("div");
      eventDiv.classList.add("eventColor");
      eventDiv.style.height = "20px";

      // Calculate the width of the bar based on percentage
      const barWidth = Math.max(minWidth, (percentage / 100) * (totalViolations / 10));
      eventDiv.style.width = `${barWidth}%`;

      // Set different background colors based on violation level
      if (violationName.includes("1"))
        eventDiv.style.backgroundColor = "#c7c7c7";
      else if (violationName.includes("2"))
        eventDiv.style.backgroundColor = "#7f7f7f";
      else if (violationName.includes("3"))
        eventDiv.style.backgroundColor = "#dbdb8d";
      else if (element.includes("4"))
        colorElementImg.style.backgroundColor = "#17becf";

      wrapperDiv.appendChild(eventDiv);
    }
  }


  violationsRectangle.appendChild(wrapperDiv);
  return violationsRectangle;
}
function createEventsBar(events) {
  const eventRectangle = document.createElement("div");
  eventRectangle.id = "eventRectangle";
  eventRectangle.innerHTML = "";

  // Calculate the percentage of each event type
  const totalEvents = Object.values(events).reduce(
    (acc, count) => acc + count,
    0
  );
  const percentages = {};
  for (const [eventName, count] of Object.entries(events)) {
    percentages[eventName] = (count / totalEvents) * 100;
  }

  const sortedPercentages = Object.entries(events)
    .map(([eventName, count]) => ({
      eventName,
      percentage: (count / totalEvents) * 100,
    }))
    .sort((a, b) => a.percentage - b.percentage);

  for (const [eventName, count] of Object.entries(events)) {
    const eventDiv = document.createElement("div");
    eventDiv.classList.add("eventColor");
    eventDiv.style.height = "20px";
    eventDiv.style.width = `${
      (count / Object.values(events).reduce((acc, count) => acc + count, 0)) *
      100
    }%`;
    eventDiv.style.backgroundColor = getColor(eventName);
    eventRectangle.appendChild(eventDiv);
  }
  return eventRectangle;
}

function generateViolationsHeatmap(violations){
  const violationsRectangle = document.getElementById("violationsHeatmap");
  violationsRectangle.style.display="flex";
  violationsRectangle.style.width="58%";
  violationsRectangle.innerHTML = "";
  
  // Calculate the percentage of each event type
  const totalViolations = Object.values(violations).reduce(
    (acc, count) => acc + count,
    0
  );

  const percentages = {};
  for (const [violationName, count] of Object.entries(violations)) {
    percentages[violationName] = (count / totalViolations) * 100;
  }

  const sortedPercentages = Object.entries(violations)
    .map(([violationName, count]) => ({
      violationName,
      percentage: (count / totalViolations) * 100,
    }))
    .sort((a, b) => a.percentage - b.percentage);

  for (const [violationName, count] of Object.entries(violations)) {
    const eventDiv = document.createElement("div");
    eventDiv.classList.add("eventColor");
    eventDiv.style.height = "70px";
    eventDiv.style.width = `${
      (count / Object.values(violations).reduce((acc, count) => acc + count, 0)) *
      100
    }%`;
    if(violationName.includes("1"))
      eventDiv.style.backgroundColor = "#f1a171";
    if(violationName.includes("2"))
      eventDiv.style.backgroundColor = "#feb24c";
    if(violationName.includes("3"))
      eventDiv.style.backgroundColor = "#f03b20";
    violationsRectangle.appendChild(eventDiv);
  }
  return violationsRectangle;
}

function generateHeatmap(userID) {
  var mainDiv = document.getElementById("heatmap");
  mainDiv.innerHTML = "";

  loadedTraces.forEach((element, index) => {
    let match = element.name.match(/_(\d+)\.[a-zA-Z]+$/);
    // Extract the captured number from the file name
    let extractedNumber = match ? match[1] : null;

    if (extractedNumber === userID) {
      let traceData = JSON.parse(element.user_trace);
      
      let cnt = 0;

      // Calculate the number of rows based on the length of the traceData array
      var rows = Math.ceil(Math.sqrt(traceData.length));
      var columns = Math.ceil(traceData.length / rows);

      traceData.forEach(function (obj, i) {
        // Create a div for each event
        var eventDiv = document.createElement("div");
        eventDiv.className = "event-rectangle";
        eventDiv.style.width = 100 / columns + "%";
        eventDiv.style.height = 100 / rows + "%";
        eventDiv.style.backgroundColor = getColor(obj.event);
        eventDiv.style.position = "absolute";
        eventDiv.style.left = (i % columns) * (100 / columns) + "%";
        eventDiv.style.top = Math.floor(i / columns) * (100 / rows) + "%";

//         if(checkIfThereisViolation(userID,obj.xpath)){
// console.log("Found violation on: "+obj.xpath+obj.event);
//         }
        // var violationCircle = document.createElement("div");
        // violationCircle.className="event-Violation";

        // Append the event div to the main div
        mainDiv.appendChild(eventDiv);
        cnt++;
      });

      // Set the number of rows and columns as CSS variables for the main div
      mainDiv.style.setProperty("--rows", rows);
      mainDiv.style.setProperty("--columns", columns);
    }

    
  });

  
}

function checkIfThereisViolation(userID,xpath){
  for (const element of violationsForAllTraces) {
    let match = element.name.match(/_(\d+)\.[a-zA-Z]+$/);
    // Extract the captured number from the file name
    let extractedNumber = match ? match[1] : null;
    //console.log(extractedNumber,number);
    if (extractedNumber === userID) {
      const userTrace = JSON.parse(element.user_trace);
      console.log(userTrace);
      for (var key in userTrace) {
        if (userTrace.hasOwnProperty(key) && Array.isArray(userTrace[key])) {
          // Check if the buttonName is present in the array
          
          if (userTrace[key].some(element => element.includes(xpath))) {
            return true;
          }
        }
      }
      return false;
    }
  }

  
}
// Function to get color based on event name
function getColor(eventName) {
  switch (eventName) {
    case "mouseover":
      return "#1f77b4";
    case "click":
      return "#ff7f0e";
    case "brush":
      return "#ffbb78";
    case "mousemove":
      return "#2ca02c";
    case "wheel":
      return "#8c564b";
    case "mouseout":
      return "#ff9896";
    case "mousedown":
      return "#98df8a";
    case "mouseup":
      return "#9467bd";
    case "dblclick":
      return "#aec7e8";
    case "Double Click":
      return "#aec7e8";
    case "facsimile back":
      return "#c5b0d5";
    // Add more cases as needed
    default:
      console.log(eventName);
      return "red";
  }
}
const eventTypesArray = [
  "mouseover",
  "click",
  "brush",
  "mousemove",
  "mousedown",
  "wheel",
  "mouseout",
  "mouseup",
  "dblclick",
  "facsimile_back",
];
function colorLegend() {
  const colorLegend = document.getElementById("colorLegend");
  const eventColumn = document.getElementById("eventColumn");
  const violationsColumn = document.getElementById("violationsColumn");

  eventTypesArray.forEach((element) => {
    let colorElementDiv = document.createElement("div");
    colorElementDiv.classList.add("legendElementDiv");

    let colorElementImg = document.createElement("div");
    colorElementImg.classList.add("colorDiv");
    if (element == "facsimile_back")
      colorElementImg.style.backgroundColor = getColor("facsimile back");
    else colorElementImg.style.backgroundColor = getColor(element);

    let colorElementText = document.createElement("p");
    colorElementText.textContent = element;

    colorElementDiv.appendChild(colorElementImg);
    colorElementDiv.appendChild(colorElementText);

    eventColumn.appendChild(colorElementDiv);
  });

  const violations =["Low","Medium","High","Critical"];
  violations.forEach((element) => {
    let colorElementDiv = document.createElement("div");
    colorElementDiv.classList.add("legendElementDiv");

    let colorElementImg = document.createElement("div");
    colorElementImg.classList.add("colorDiv");
    if (element.includes("Low"))
      colorElementImg.style.backgroundColor = "#c7c7c7";
    else if (element.includes("Medium"))
      colorElementImg.style.backgroundColor = "#7f7f7f";
    else if (element.includes("High"))
      colorElementImg.style.backgroundColor = "#dbdb8d";
    else if (element.includes("Critical"))
      colorElementImg.style.backgroundColor = "#17becf";

    let colorElementText = document.createElement("p");
    colorElementText.textContent = element;

    colorElementDiv.appendChild(colorElementImg);
    colorElementDiv.appendChild(colorElementText);

    violationsColumn.appendChild(colorElementDiv);
  });

}

function toggleLegend() {
  const colorLegend = document.getElementById("colorLegend");
  const buttonImg = document.getElementById("colorLegendButton");
  console.log(colorLegend.getAttribute("data-visible"));
  if (colorLegend.getAttribute("data-visible") == "false") {
    colorLegend.setAttribute("data-visible", "true");
    buttonImg.style.transform = "rotate(0deg)";
    colorLegend.style.height = "310px";
  } else {
    colorLegend.setAttribute("data-visible", "false");
    buttonImg.style.transform = "rotate(180deg)";
    colorLegend.style.height = "31px";
  }
}


function previewTrace(){

}