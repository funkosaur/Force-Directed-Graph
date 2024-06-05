// Fetch and parse the IIIF manifest
fetch("https://media.nga.gov/public/manifests/nga_highlights.json")
  .then((response) => response.json())
  .then((manifest) => {
    // Extract and structure data for D3
    const nodes = [];
    const links = [];

    // Example: extracting canvases and annotations
    manifest.sequences.forEach((sequence) => {
      sequence.canvases.forEach((canvas) => {
        const nodeId = canvas["@id"];
        const imageUrl = getThumbnailUrl(
          canvas.images[0].resource["@id"]
        );
        const metadata = canvas.metadata || []; // Default to an empty array if metadata is missing
        const date = getDateString(metadata); // Extract the date from metadata

        // Add the canvas node to nodes array
        nodes.push({
          id: nodeId,
          type: "canvas",
          label: canvas.label,
          imageUrl: imageUrl,
          date: date, // Store the date for comparison
        });

      });
    });

    // Function to get thumbnail URL from the full image URL
    function getThumbnailUrl(fullImageUrl) {
      return fullImageUrl.replace(
        "/full/full/0/default.jpg",
        "/full/200,/0/default.jpg"
      ); // Adjust URL to request a smaller size
    }

    // Function to extract the date from metadata
    function getDateString(metadata) {
      for (const meta of metadata) {
        if (meta.label === "Date") {
          return meta.value; // Return the date value
        }
      }
      return null; // Return null if no date found
    }

    // Create links between nodes with the same date
    nodes.forEach((nodeA, indexA) => {
      nodes.forEach((nodeB, indexB) => {
        if (nodeA.date === nodeB.date && nodeA.id !== nodeB.id) {
          links.push({ source: nodeA.id, target: nodeB.id });
        }
      });
    });

    // Initialize the force-directed graph
    const svg = d3.select("svg"),
      width = +svg.attr("width"),
      height = +svg.attr("height");

    const simulation = d3
      .forceSimulation(nodes)
      .force(
        "link",
        d3
          .forceLink(links)
          .id((d) => d.id)
          .distance(100)
      ) // Adjust link distance
      .force("charge", d3.forceManyBody())
      .force("center", d3.forceCenter(width / 2, height / 2));

    const link = svg
      .append("g")
      .attr("class", "links")
      .selectAll("line")
      .data(links)
      .enter()
      .append("line")
      .attr("class", "link")
      .attr("stroke", "#999")
      .attr("stroke-width", 2)
      .attr("stroke-opacity", 0.6);

    const node = svg
      .append("g")
      .attr("class", "nodes")
      .selectAll("g")
      .data(nodes)
      .enter()
      .append("g")
      .attr("class", "node");

    node
      .append("image")
      .attr("xlink:href", (d) => d.imageUrl)
      .attr("width", 30)
      .attr("height", 30)
      .attr("x", -15)
      .attr("y", -15);

    node.append("title").text((d) => d.label);

    simulation.on("tick", () => {
      link
        .attr("x1", (d) => d.source.x)
        .attr("y1", (d) => d.source.y)
        .attr("x2", (d) => d.target.x)
        .attr("y2", (d) => d.target.y);

      node.attr("transform", (d) => `translate(${d.x},${d.y})`);
    });
  })
  .catch((error) => {
    console.error("Error fetching IIIF manifest:", error);
  });
