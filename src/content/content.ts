// content.ts

class NetSuiteFieldEnhancer {
  private DEBUG = true;

  constructor() {
      this.initialize();
  }

  private log(...args: any[]): void {
      if (this.DEBUG) {
          console.log('[NetSuite Assistant]', ...args);
      }
  }

  private initialize(): void {
      if (window.self === window.top) {
          this.setupMainWindowHandlers();
      } else {
          this.setupHelpFrameHandlers();
      }
  }

  private setupMainWindowHandlers(): void {
      this.log('Setting up main window handlers');
      
      const observer = new MutationObserver((mutations) => {
          mutations.forEach(mutation => {
              mutation.addedNodes.forEach(node => {
                  if (node instanceof HTMLElement) {
                      const helpFrame = node.querySelector('#fieldhelp_frame');
                      if (helpFrame) {
                          this.log('Help frame detected');
                          this.handleHelpFrame(helpFrame as HTMLIFrameElement);
                      }
                  }
              });
          });
      });

      observer.observe(document.body, {
          childList: true,
          subtree: true
      });
  }

  private setupHelpFrameHandlers(): void {
      this.log('Setting up help frame handlers');
      
      if (document.readyState === 'loading') {
          document.addEventListener('DOMContentLoaded', () => this.enhanceHelpContent());
      } else {
          this.enhanceHelpContent();
      }
  }

  private handleHelpFrame(frame: HTMLIFrameElement): void {
      this.log('Handling help frame');
      
      frame.addEventListener('load', () => {
          try {
              const frameDoc = frame.contentDocument || frame.contentWindow?.document;
              if (frameDoc) {
                  this.log('Frame loaded, attempting to enhance content');
                  this.injectStylesIntoFrame(frameDoc);
                  this.enhanceHelpContent(frameDoc);
              }
          } catch (e) {
              this.log('Error accessing frame:', e);
          }
      });
  }

  private injectStylesIntoFrame(doc: Document): void {
    const style = doc.createElement('style');
    style.textContent = `
        .field-info-container {
            margin: 0;
            padding: 6px 0 0 0;
            font-family: Arial, sans-serif;
            font-size: 12px;
            clear: both;          /* Clear the float */
            width: 100%;         /* Take full width */
        }
        .field-info-row {
            margin: 4px 0;
            color: #333333;
            display: block;
            text-align: right;    /* Right align text */
            float: right;         /* Float right like Field ID */
            clear: both;          /* Clear float for each row */
            width: 100%;         /* Take full width */
        }
        .field-info-label {
            font-weight: bold;
            display: inline-block;
            margin-right: 4px;
            color: #333333;
        }
        .field-info-value {
            color: #333333;
            display: inline-block;
        }
        td {
            position: relative;   /* Establish positioning context */
        }
    `;
    doc.head.appendChild(style);
}

  private enhanceHelpContent(doc: Document = document): void {
      this.log('Enhancing help content');

      if (doc.querySelector('.field-info-container')) {
          this.log('Content already enhanced');
          return;
      }

      // Find the Field ID span specifically
      const fieldIdSpan = Array.from(doc.getElementsByTagName('span'))
          .find(span => 
              span.textContent?.includes('Field ID:') && 
              span.style.getPropertyValue('float') === 'right'
          );

      if (!fieldIdSpan) {
          this.log('Field ID span not found');
          return;
      }

      // Get the parent tr element
      const parentRow = fieldIdSpan.closest('tr');
      if (!parentRow) {
          this.log('Parent row not found');
          return;
      }

      // Get field information from URL parameters
      const params = new URLSearchParams(window.location.search);
      const fieldId = params.get('f') || 'memo';

      // Try to get field element from parent window
      const parentField = window.top?.document.querySelector(`[name="${fieldId}"]`) as HTMLInputElement;
      
      if (parentField) {
          const metadata = {
              type: parentField.getAttribute('data-field-type') || parentField.type || 'text',
              maxLength: parentField.getAttribute('maxlength') || '999',
              currentLength: parentField.value.length
          };

          // Add field information directly to the parent td cell
          const parentCell = parentRow.querySelector('td');
          if (parentCell) {
              const container = doc.createElement('div');
              container.className = 'field-info-container';

              const info = [
                  { label: 'Field Type', value: metadata.type },
                  { label: 'Max Length', value: metadata.maxLength },
                  { label: 'Current Length', value: metadata.currentLength }
              ];

              info.forEach(item => {
                  const row = doc.createElement('div');
                  row.className = 'field-info-row';
                  
                  const label = doc.createElement('span');
                  label.className = 'field-info-label';
                  label.textContent = `${item.label}: `;
                  row.appendChild(label);

                  if (item.label === 'Current Length') {
                      const valueSpan = doc.createElement('span');
                      valueSpan.className = 'field-info-value current-length';
                      valueSpan.textContent = metadata.currentLength.toString();
                      row.appendChild(valueSpan);

                      // Set up live update
                      parentField.addEventListener('input', () => {
                          valueSpan.textContent = parentField.value.length.toString();
                      });
                  } else {
                      const valueSpan = doc.createElement('span');
                      valueSpan.className = 'field-info-value';
                      valueSpan.textContent = item.value.toString();
                      row.appendChild(valueSpan);
                  }

                  container.appendChild(row);
              });

              // Add to the same cell as the Field ID
              parentCell.appendChild(container);
              this.log('Help content enhanced successfully');
          }
      }
  }
}

// Initialize with error handling
try {
  new NetSuiteFieldEnhancer();
} catch (error) {
  console.error('[NetSuite Assistant] Initialization error:', error);
}