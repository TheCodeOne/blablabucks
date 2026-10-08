# Glossary

This file defines the domain language for the **Burn Rate Tracker** application. Always use these exact terms in code (variables, components, files) and documentation.

- **Burn Rate**: The speed at which money is being spent, calculated as the sum of all active participants multiplied by their respective hourly rates. Usually expressed per second or millisecond in calculations, but per hour in the settings.
- **Burn Rate Tracker**: The name of the application.
- **Taxameter**: The huge, central UI component that displays the accumulating cost in real-time with fluid animations.
- **Category (or Role)**: The classification of a meeting participant. The five strict categories are:
  1. Internal Dev
  2. External Dev
  3. NearShoring Dev
  4. Internal Non-Dev
  5. External Non-Dev
- **Headcount**: The current number of people present in the meeting for a specific Category.
- **Rate**: The hourly cost (Stundensatz) associated with a Category.
- **Settings Modal**: The configuration UI where Rates are defined.
- **Quick Settings**: The UI on the main screen containing `+` and `-` buttons to adjust the Headcount dynamically without stopping the tracker.
- **Session State**: The data required to make the tracker resilient to tab throttling and page refreshes. It consists of the `accumulatedCost` (up to the last change), the `lastChangeTimestamp` (absolute time of the last Headcount change or start), and the current `Burn Rate`.
