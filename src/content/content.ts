// content.ts

interface FieldMetadata {
  fieldType: string;
  maxLength: number;
  currentLength: number;
  fieldId: string;
}

class NetSuiteFieldEnhancer {
  private tooltipClass = 'ns-field-info-tooltip';

  constructor() {
      this.initialize();
  }

  private initialize(): void {
      if (document.readyState === 'loading') {
          document.addEventListener('DOMContentLoaded', () => this.setupFieldListeners());
      } else {
          this.setupFieldListeners();
      }

      this.observePageChanges();
  }

  private observePageChanges(): void {
      const observer = new MutationObserver((mutations: MutationRecord[]) => {
          mutations.forEach((mutation: MutationRecord) => {
              if (mutation.addedNodes.length) {
                  this.setupFieldListeners();
              }
          });
      });

      observer.observe(document.body, {
          childList: true,
          subtree: true
      });
  }

  private setupFieldListeners(): void {
      const fieldLabels = document.querySelectorAll('.smallgraytextnolink.uir-label') as NodeListOf<HTMLElement>;
      
      fieldLabels.forEach((label: HTMLElement) => {
          if (!label.hasAttribute('data-ns-enhanced')) {
              label.addEventListener('click', this.handleFieldClick.bind(this));
              label.setAttribute('data-ns-enhanced', 'true');
              label.style.cursor = 'help';
          }
      });
  }

  private handleFieldClick(e: MouseEvent): void {
      const label = e.currentTarget as HTMLElement;
      const fieldId = this.getFieldId(label);
      
      if (fieldId) {
          this.getFieldMetadata(fieldId).then(metadata => {
              this.showTooltip(label, metadata);
              e.stopPropagation();
          });
      }
  }

  private getFieldId(label: HTMLElement): string | null {
      const fieldContainer = label.closest('.uir-field-wrapper');
      if (!fieldContainer) return null;

      const fieldElement = fieldContainer.querySelector('input, textarea, select');
      return fieldElement?.getAttribute('name') || null;
  }

  private async getFieldMetadata(fieldId: string): Promise<FieldMetadata> {
      const fieldElement = document.querySelector(`[name="${fieldId}"]`) as HTMLInputElement | HTMLTextAreaElement;
      
      const currentLength = fieldElement?.value?.length || 0;
      const maxLength = fieldElement?.maxLength || 999;
      
      let fieldType = 'text';
      if (fieldElement) {
          if (fieldElement.tagName === 'TEXTAREA') {
              fieldType = 'textarea';
          } else if (fieldElement instanceof HTMLInputElement) {
              fieldType = fieldElement.type;
          }
      }

      return {
          fieldType,
          maxLength,
          currentLength,
          fieldId
      };
  }

  private showTooltip(element: HTMLElement, metadata: FieldMetadata): void {
      this.removeExistingTooltips();

      const tooltip = document.createElement('div');
      tooltip.className = this.tooltipClass;
      tooltip.innerHTML = `
          <div style="
              position: absolute;
              background: #f8f9fa;
              border: 1px solid #dee2e6;
              padding: 8px;
              border-radius: 4px;
              box-shadow: 0 2px 4px rgba(0,0,0,0.1);
              z-index: 10000;
              max-width: 250px;
              font-size: 12px;
              font-family: Arial, sans-serif;
          ">
              <p style="margin: 4px 0;"><strong>Field Type:</strong> ${metadata.fieldType}</p>
              <p style="margin: 4px 0;"><strong>Max Length:</strong> ${metadata.maxLength}</p>
              <p style="margin: 4px 0;"><strong>Current Length:</strong> ${metadata.currentLength}</p>
              <p style="margin: 4px 0; font-size: 11px; color: #666;">Field ID: ${metadata.fieldId}</p>
          </div>
      `;

      const rect = element.getBoundingClientRect();
      const tooltipDiv = tooltip.querySelector('div') as HTMLElement;
      tooltipDiv.style.position = 'fixed';
      tooltipDiv.style.top = `${rect.bottom + 5}px`;
      tooltipDiv.style.left = `${rect.left}px`;

      document.body.appendChild(tooltip);

      setTimeout(() => {
          document.addEventListener('click', this.handleDocumentClick);
      }, 0);
  }

  private handleDocumentClick = (e: Event): void => {
      const target = e.target as Element;
      if (!target || !target.closest(`.${this.tooltipClass}`)) {
          this.removeExistingTooltips();
      }
  };

  private removeExistingTooltips(): void {
      document.querySelectorAll(`.${this.tooltipClass}`).forEach(tooltip => tooltip.remove());
      document.removeEventListener('click', this.handleDocumentClick);
  }
}

// Initialize when the script loads
(() => {
  new NetSuiteFieldEnhancer();
})();