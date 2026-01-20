# G-code Combiner

Combine multiple Bambu Lab print files into one continuous batch print with automatic part ejection.

Upload your `.gcode.3mf` files, set how many copies of each you need, arrange the order, and download a single combined file. Load it onto your printer and walk away — it'll print everything in sequence, ejecting each part before starting the next.

## What It Does

When you slice a model in Bambu Studio and export it as a `.gcode.3mf` file, that file contains all the instructions for one print. But what if you want to print 10 of model A, 5 of model B, and 3 of model C in one unattended session?

That's what this tool solves. It takes multiple sliced files and merges them into a single G-code sequence. Combined with the right printer profile that handles part ejection, your printer becomes a mini production line.

## Features

- **Multi-file support** — Upload as many `.gcode.3mf` files as you need
- **Multi-plate detection** — If you sliced a project with multiple plates, each plate is detected separately
- **Copy counts** — Print 1 copy or 99 copies of any plate
- **Custom ordering** — Drag files to set the exact print sequence
- **Time estimates** — See the total estimated print time before you start
- **100% local** — Everything runs in your browser. Your files never leave your computer.

## Supported Printers

This works with Bambu Lab printers that support automatic part ejection:

| Printer | Ejection Method |
|---------|-----------------|
| A1 | Built-in (flex plate + wiper arm) |
| A1 Mini | Built-in (flex plate + wiper arm) |
| P1S | Aftermarket solutions |
| X1C | Aftermarket solutions |

## Before You Start

Your sliced files need the correct start and end G-code to handle ejection between prints. Without this, the printer will just stack parts on top of each other.

**Get the automation profiles here:** [Factorian Designs - Print Automation for Bambu Lab](https://factoriandesigns.com/print-automation-bambu-lab-a1-a1-mini)

Install the profile in Bambu Studio, slice your models with it, then export as `.gcode.3mf`.

## How to Use

1. Open the web app
2. Drag your `.gcode.3mf` files onto the upload area
3. Set copy counts for each file/plate
4. Drag to reorder if needed
5. Check the "I've installed the automation profile" box
6. Click **Combine & Download**
7. Send the combined file to your printer

The output file works exactly like any other `.gcode.3mf` — send it via Bambu Studio, SD card, or the Bambu Handy app.

## How It Works Technically

A `.gcode.3mf` file is actually a ZIP archive containing G-code instructions at `Metadata/plate_X.gcode`. This tool:

1. Extracts the G-code from each uploaded file
2. Detects multi-plate projects and separates them
3. Concatenates the G-code in your specified order (respecting copy counts)
4. Adds comment markers between prints for debugging
5. Packages everything back into a valid `.gcode.3mf` archive

The combined file uses the first uploaded file as a template for the archive structure.
