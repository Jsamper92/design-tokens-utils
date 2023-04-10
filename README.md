# Design Tokens Utils

Design Tokens Utils aims to provide a series of common utilities at the start of any web project, which will make it easier and faster to start the architecture.

## Installation

```
npm install design-tokens-utils
```

## Example

```
design-tokens-utils --tokens=.frontech.json --path=assets
```

Options flags command line:

| Flags | Description                                         |
| ----- | --------------------------------------------------- |
| tokens  | File Configuration Tokens                                  |
| theme | Set of tokens specific to the configuration file. Otherwise, it will select all those defined in the metadata.. |
| platforms   | [Style dictionary](https://amzn.github.io/style-dictionary/#/config) config to other plataforms.          |
| path  | Path to build architecture.    |

For the proper functioning of the library, it is necessary to create a configuration file in the project. This configuration must maintain [Tokens Studio Figma](https://docs.tokens.studio/tokens/json-schema) structure:

```
{
    "_palette-brand-example": {
      "_icons": {
        "ds": {
          "icon": {
            "close": {
              "value": "https://www.figma.com/file/OydaDnZc16mulAMyxZcsMJ/%5Bexample<%5D-_icons?node-id=47-2299&t=SwiaYNlv9zVpdq6i-4",
              "type": "asset"
            }
          }
        }
      },
      "color": {
        "white": {
          "value": "#ffffff",
          "type": "color"
        },
              "black": {
        "value": "#0A0A0A",
        "type": "color"
      },
        "gray": {
          "50": {
            "value": "#f6f6f6",
            "type": "color"
          },
          "100": {
            "value": "#e8e8e8",
            "type": "color"
          },
          "200": {
            "value": "#d9d9d9",
            "type": "color"
          },
          "300": {
            "value": "#bfbfbf",
            "type": "color"
          },
          "400": {
            "value": "#a6a6a6",
            "type": "color"
          },
          "500": {
            "value": "#8c8c8c",
            "type": "color"
          },
          "600": {
            "value": "#737373",
            "type": "color"
          },
          "700": {
            "value": "#4D4D4D",
            "type": "color"
          },
          "800": {
            "value": "#373737",
            "type": "color"
          },
          "900": {
            "value": "#1C1C1C",
            "type": "color"
          }
        },
      }
  }
}
```
