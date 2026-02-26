# SciacqueTEN 🎓

A modern, fast, and light web-based tool designed for teachers to convert student exam scores into a base-10 scale (typically used in Italian schools).

## 🚀 Features

- **Real-Time Calculation**: See results instantly as you type.
- **Dynamic Repeater**: Add as many score fields as needed. Use the `Enter` key to quickly add a new row.
- **Voice Commands**: Add scores hands-free by speaking numbers. Use "Stop" or "Ferma" to end recording.
- **Integrated Help Guide**: A quick-access modal with instructions on all application features.
- **Smart Rounding**: Automatically suggests the school grade equivalent (e.g., 6, 6+, 6.5, 7-) based on standard increments.
- **Visual Feedback**: Results are color-coded (Red for fail, Green for pass) for both decimal and suggested grades.
- **Bilingual**: Supports English and Italian with automatic browser language detection.
- **Premium UI**: Modern design with glassmorphism effects and Bootstrap 5.
- **Dark/Light Mode**: Respects system theme by default, with a manual toggle and persistence.
- **Data Persistence**: Automatically saves your current session (scores, theme, language) in the browser's local storage.

## 🛠️ Technology Stack

- **HTML5** (Semantic structure)
- **Bootstrap 5** (Layout and base components)
- **CSS3** (Custom glassmorphism design and themes)
- **Vanilla JavaScript** (State management and calculation logic)
- **Web Speech API** (For voice recording)
- **Bootstrap Icons**

## 📖 How to Use

1. Open `index.html` in any modern web browser.
2. Enter the **Maximum Score** possible for the test.
3. Start entering student scores in the list.
4. Press **Enter** to add a new score field quickly.
5. Alternatively, click the **Microphone** icon to start voice recording and say your scores. Speak "Stop" or "Ferma" to finish.
6. Click the **Question Mark** icon for a quick feature guide.
7. Review the **Total/Maximum** card and the results table for decimal and suggested grades.
8. Use the **Restart** (Ricomincia) button to clear the scores while keeping the Maximum Score for the next batch.

## 🤝 Contribution

This tool was created with ❤️ by [cellicom](https://github.com/cellicom).
Feel free to fork this repository and submit pull requests for any improvements!
