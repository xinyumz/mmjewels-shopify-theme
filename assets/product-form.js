if (!customElements.get("product-form")) {
  customElements.define(
    "product-form",
    class ProductForm extends HTMLElement {
      constructor() {
        super();

        this.form = this.querySelector("form");
        this.variantIdInput.disabled = false;
        this.form.addEventListener("submit", this.onSubmitHandler.bind(this));
        this.cart =
          document.querySelector("cart-notification") ||
          document.querySelector("cart-drawer");
        this.submitButton = this.querySelector('[type="submit"]');
        this.submitButtonText = this.submitButton.querySelector("span");
        this.dynamicCheckoutButtons = this.querySelector(
          ".shopify-payment-button"
        );

        if (document.querySelector("cart-drawer"))
          this.submitButton.setAttribute("aria-haspopup", "dialog");

        this.hideErrors = this.dataset.hideErrors === "true";

        this.isCustomProduct = this.dataset.isCustomLetter === "true";

        if (this.isCustomProduct) {
          this.initCustomLetterForm();
          this.initCustomForm();
          this.initCharacterCount();
        }

        this.initDynamicCheckout();
      }

      formatProperties(customFormData) {
        let properties = {};
        for (let [key, value] of customFormData.entries()) {
          // Remove 'properties[' and ']' from the key
          let cleanKey = key.replace("properties[", "").replace("]", "");
          properties[cleanKey] = value;
        }

        // Ensure properties are in the desired order
        let orderedProperties = {};
        if ("Color" in properties)
          orderedProperties["Color"] = properties["Color"];
        if ("Ring Size" in properties)
          orderedProperties["Ring Size"] = properties["Ring Size"];
        if ("Custom Text" in properties)
          orderedProperties["Custom Text"] = properties["Custom Text"];
        if ("Font" in properties)
          orderedProperties["Font"] = properties["Font"];

        return orderedProperties;
      }

      initCustomForm() {
        this.customForm = document.querySelector("#custom-letter-product-form");
        this.isCustomProduct =
          document.querySelector("script[data-custom-product]") !== null;

        if (this.isCustomProduct && this.customForm) {
          console.log("Custom product form found and initialized");
          this.customForm.addEventListener(
            "change",
            this.onCustomFormChange.bind(this)
          );
          if (this.dynamicCheckoutButtons) {
            this.dynamicCheckoutButtons.addEventListener(
              "click",
              this.onDynamicCheckoutClick.bind(this),
              true
            );
          }
        } else if (this.isCustomProduct && !this.customForm) {
          console.error("Custom product detected but form not found");
        }
      }

      initCustomLetterForm() {
        if (this.dataset.isCustomLetter === "true") {
          const customForm = document.getElementById(
            "custom-letter-product-form"
          );
          if (customForm) {
            customForm.addEventListener("change", () => {
              this.validateCustomForm();
            });
          }
        }
      }

      initCharacterCount() {
        const customTextField = document.getElementById("custom-text");
        const charCountSpan = document.getElementById("char-count");

        if (customTextField && charCountSpan) {
          customTextField.addEventListener("input", function () {
            const remainingChars = 9 - this.value.length;
            charCountSpan.textContent = `${this.value.length}/9`;

            if (remainingChars <= 1) {
              charCountSpan.style.color = "red";
            } else {
              charCountSpan.style.color = "#888";
            }
          });
        }
      }
      onCustomFormChange() {
        this.validateCustomForm();
      }

      onDynamicCheckoutClick(event) {
        event.preventDefault();
        event.stopPropagation();

        if (this.isCustomProduct) {
          if (!this.validateCustomForm()) {
            console.log("Custom form validation failed");
            return;
          }
        }

        // Use Cart API to add item with properties
        const formData = new FormData(this.form);
        let properties = {};

        if (this.isCustomProduct && this.customForm) {
          const customFormData = new FormData(this.customForm);
          properties = this.formatProperties(customFormData);
        }

        const data = {
          items: [
            {
              id: formData.get("id"),
              quantity: formData.get("quantity"),
              properties: properties,
            },
          ],
        };

        fetch("/cart/add.js", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        })
          .then((response) => response.json())
          .then((result) => {
            // Redirect to checkout
            window.location.href = "/checkout";
          })
          .catch((error) => {
            console.error("Error:", error);
            this.handleErrorMessage(error.message);
          });
      }

      validateCustomForm() {
        if (!this.isCustomProduct || !this.customForm) return true;

        let isValid = true;
        const properties = ["Custom Text", "Font", "Color"];
        if (this.customForm.querySelector('[name="properties[Ring Size]"]')) {
          properties.push("Ring Size");
        }

        properties.forEach((prop) => {
          let field;
          if (prop === "Color") {
            field = this.customForm.querySelector(
              'input[name="properties[Color]"]:checked'
            );
          } else {
            field = this.customForm.querySelector(
              `[name="properties[${prop}]"]`
            );
          }
          if (
            !field ||
            (prop === "Color" && !field) ||
            (prop !== "Color" && !field.value)
          ) {
            this.showError(
              prop === "Color"
                ? this.customForm.querySelector(".radio-group")
                : field,
              `Please select a ${prop.toLowerCase()}`
            );
            isValid = false;
          } else {
            this.hideError(
              prop === "Color"
                ? this.customForm.querySelector(".radio-group")
                : field
            );
          }
        });

        // Enable or disable dynamic checkout buttons based on validation
        if (this.dynamicCheckoutButtons) {
          if (isValid) {
            this.dynamicCheckoutButtons.style.pointerEvents = "auto";
            this.dynamicCheckoutButtons.style.opacity = "1";
          } else {
            this.dynamicCheckoutButtons.style.pointerEvents = "none";
            this.dynamicCheckoutButtons.style.opacity = "0.5";
          }
        }

        if (isValid) {
          this.enableDynamicCheckout();
        } else {
          this.disableDynamicCheckout();
        }

        return isValid;
      }

      enableDynamicCheckout() {
        const dynamicCheckoutButtons = this.querySelector(
          ".shopify-payment-button"
        );
        if (dynamicCheckoutButtons) {
          dynamicCheckoutButtons.style.pointerEvents = "auto";
          dynamicCheckoutButtons.style.opacity = "1";
        }
      }

      disableDynamicCheckout() {
        const dynamicCheckoutButtons = this.querySelector(
          ".shopify-payment-button"
        );
        if (dynamicCheckoutButtons) {
          dynamicCheckoutButtons.style.pointerEvents = "none";
          dynamicCheckoutButtons.style.opacity = "0.5";
        }
      }

      showError(element, message) {
        let errorElement = element
          .closest(".form-group")
          .querySelector(".error-message");
        if (!errorElement) {
          errorElement = document.createElement("div");
          errorElement.classList.add("error-message");
          element.closest(".form-group").appendChild(errorElement);
        }
        errorElement.textContent = message;
        errorElement.style.display = "block";
        errorElement.style.color = "red"; // Ensure the error message is visible
      }

      hideError(element) {
        const errorElement = element
          .closest(".form-group")
          .querySelector(".error-message");
        if (errorElement) {
          errorElement.style.display = "none";
        }
      }

      clearAllErrors() {
        const errorMessages = this.querySelectorAll(".error-message");
        errorMessages.forEach((error) => (error.style.display = "none"));
      }

      initDynamicCheckout() {
        if (this.isCustomProduct) {
          const dynamicCheckoutButtons = this.querySelector(
            ".shopify-payment-button"
          );
          if (dynamicCheckoutButtons) {
            dynamicCheckoutButtons.addEventListener(
              "click",
              this.onDynamicCheckoutClick.bind(this),
              true
            );
          }
        }
      }

      onDynamicCheckoutClick(event) {
        if (!this.isCustomProduct) return; // Allow default behavior for non-custom products

        event.preventDefault();
        event.stopPropagation();

        if (!this.validateCustomForm()) {
          console.log("Custom form validation failed");
          return;
        }

        // Use Cart API to add item with properties
        const formData = new FormData(this.form);
        const customFormData = new FormData(this.customForm);

        let properties = this.formatProperties(customFormData);

        const data = {
          items: [
            {
              id: formData.get("id"),
              quantity: formData.get("quantity"),
              properties: properties,
            },
          ],
        };

        fetch("/cart/add.js", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        })
          .then((response) => response.json())
          .then((result) => {
            // Redirect to checkout
            window.location.href = "/checkout";
          })
          .catch((error) => {
            console.error("Error:", error);
            this.handleErrorMessage(error.message);
          });
      }

      onSubmitHandler(evt) {
        evt.preventDefault();
        if (this.submitButton.getAttribute("aria-disabled") === "true") return;

        // Clear any existing errors
        this.clearAllErrors();

        this.handleErrorMessage();

        // Validate the custom form if it's a custom product
        if (this.isCustomProduct && !this.validateCustomForm()) {
          console.log("Custom form validation failed");
          return; // Return early if validation fails
        }

        this.submitButton.setAttribute("aria-disabled", true);
        this.submitButton.classList.add("loading");
        this.querySelector(".loading__spinner").classList.remove("hidden");

        const config = fetchConfig("javascript");
        config.headers["X-Requested-With"] = "XMLHttpRequest";
        delete config.headers["Content-Type"];

        const formData = new FormData(this.form);

        // Add custom properties for custom products
        if (this.isCustomProduct && this.customForm) {
          const customFormData = new FormData(this.customForm);
          const formattedProperties = this.formatProperties(customFormData);
          for (let [key, value] of Object.entries(formattedProperties)) {
            formData.append(`properties[${key}]`, value);
          }
        }

        if (this.cart) {
          formData.append(
            "sections",
            this.cart.getSectionsToRender().map((section) => section.id)
          );
          formData.append("sections_url", window.location.pathname);
          this.cart.setActiveElement(document.activeElement);
        }

        config.body = formData;

        fetch(`${routes.cart_add_url}`, config)
          .then((response) => response.json())
          .then((response) => {
            if (response.status) {
              this.handleErrorMessage(response.description);
              const soldOutMessage =
                this.submitButton.querySelector(".sold-out-message");
              if (soldOutMessage) {
                this.submitButton.setAttribute("aria-disabled", true);
                this.submitButtonText.classList.add("hidden");
                soldOutMessage.classList.remove("hidden");
              }
              this.error = true;
              return;
            }

            this.error = false;

            const quickAddModal = this.closest("quick-add-modal");
            if (quickAddModal) {
              document.body.addEventListener(
                "modalClosed",
                () => {
                  setTimeout(() => {
                    this.cart.renderContents(response);
                  });
                },
                { once: true }
              );
              quickAddModal.hide(true);
            } else {
              this.cart.renderContents(response);
            }

            publish(PUB_SUB_EVENTS.cartUpdate, {
              source: "product-form",
              productVariantId: formData.get("id"),
              cartData: response,
            });
          })
          .catch((e) => {
            console.error(e);
            const errorMessage =
              "There was an error adding this item to the cart. Please try again.";
            this.handleErrorMessage(errorMessage);
          })
          .finally(() => {
            this.submitButton.classList.remove("loading");
            if (this.cart && this.cart.classList.contains("is-empty")) {
              this.cart.classList.remove("is-empty");
            }
            if (!this.error) {
              this.submitButton.removeAttribute("aria-disabled");
            }
            this.querySelector(".loading__spinner").classList.add("hidden");
          });
      }

      handleErrorMessage(errorMessage = false) {
        if (this.hideErrors) return;

        this.errorMessageWrapper =
          this.errorMessageWrapper ||
          this.querySelector(".product-form__error-message-wrapper");
        if (!this.errorMessageWrapper) return;
        this.errorMessage =
          this.errorMessage ||
          this.errorMessageWrapper.querySelector(
            ".product-form__error-message"
          );

        this.errorMessageWrapper.toggleAttribute("hidden", !errorMessage);

        if (errorMessage) {
          this.errorMessage.textContent = errorMessage;
        }
      }

      toggleSubmitButton(disable = true, text) {
        if (disable) {
          this.submitButton.setAttribute("disabled", "disabled");
          if (text) this.submitButtonText.textContent = text;
        } else {
          this.submitButton.removeAttribute("disabled");
          this.submitButtonText.textContent = window.variantStrings.addToCart;
        }
      }

      get variantIdInput() {
        return this.form.querySelector("[name=id]");
      }
    }
  );
}
