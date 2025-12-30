# Weekly Availability Schedule

A professional weekly schedule manager with dynamic JSON data loading.

## Features

- **Visual Weekly Schedule**: 7:00 AM to 8:00 PM, Monday to Sunday
- **Dynamic JSON Data**: Load and edit schedule data from JSON file
- **Activity Types**: Free time, Work, Meetings, Personal, Busy
- **PDF Export**: Generate professional PDF reports
- **Statistics**: Track total hours, free time, and activities
- **Responsive Design**: Works on desktop and mobile
- **Edit Directly**: Modify JSON data through in-app editor

## File Structure

```
availability-schedule/
├── index.html          # Main HTML file
├── style.css           # CSS styles
├── script.js           # JavaScript functionality
├── schedule.json       # Schedule data (editable)
└── README.md           # This file
```


## How to Use

1. **Open** `index.html` in your browser
2. **Edit** your schedule by:
   - Clicking "Edit Schedule Data (JSON)"
   - Modifying the JSON in the editor
   - Clicking "Save & Update"
3. **Export** to PDF by clicking "Export as PDF"
4. **Save/Load** JSON files using the buttons

## Customization

### Change Colors
Edit the CSS variables in `style.css` for activity types:
- `.free-time`
- `.work`
- `.meeting`
- `.personal`
- `.busy`

### Modify Time Slots
Edit the `timeSlots` array in `schedule.json` or through the JSON editor.

### Add Activity Types
1. Add new type in JSON (`activities[].type`)
2. Add corresponding CSS class in `style.css`
3. Update legend in `script.js` `renderLegend()` function

## Browser Compatibility

- Chrome 60+
- Firefox 55+
- Safari 11+
- Edge 79+

## Dependencies

- Font Awesome 6.4.0 (CDN)
- jsPDF 2.5.1 (CDN)

## License

MIT License - Feel free to use and modify for your needs.