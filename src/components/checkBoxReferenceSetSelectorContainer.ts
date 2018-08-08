import { Component, createElement } from "react";
import "../ui/checkBoxReferenceSetSelector.css";

interface WrapperProps {
    class: string;
    mxObject: mendix.lib.MxObject;
    mxform: mxui.lib.form._FormBase;
    style: string;
    readOnly: boolean;

}

export interface ContainerProps extends WrapperProps {
    checkBoxType: string;
    dataSource: "xpath" | "microflow";
    entity: string;
    displayAttribute: string;
    fieldCaption: string;
    constraint: string;
    showLabel: string;
    caption: string;
    callMicroflow: string;
    formOrientation: "horizontal" | "vertical";
}

// tslint:disable-next-line:interface-over-type-literal
export type CheckboxItems = {
    caption?: string | number | boolean,
    guid: string;
    isChecked: boolean
};

interface ContainerState {
    checkboxItems: CheckboxItems[];
    isChecked: boolean;
}

export default class CheckBoxReferenceSetSelectorContainer extends Component<ContainerProps, ContainerState> {
    private subscriptionHandles: number[] = [];

    readonly state: ContainerState = {
        checkboxItems: [],
        isChecked: false
    };
    private entity: string;
    private reference: string;
    mxObj: mendix.lib.MxObject;
    constructor(props: ContainerProps) {
        super(props);

        this.entity = this.props.entity.split("/")[1];
        this.reference = this.props.entity.split("/")[0];
        this.getDataFromXPath = this.getDataFromXPath.bind(this);
        this.handleChange = this.handleChange.bind(this);
        this.getDataFromMicroflow = this.getDataFromMicroflow.bind(this);
    }

    render() {
        return createElement("div",
            {
                className: "checkBoxReferenceSetSelector"
            },
            createElement("legend", {}, "Departments",
                createElement("div",
                    {
                        className: "checkbox"
                    },

                    this.props.fieldCaption,
                    this.renderLabels()
                )
            )
        );
    }

    private renderLabels() {
        return this.state.checkboxItems.map(_items =>
            createElement("label", {},
                createElement("input",
                    {
                        type: "checkbox",
                        className: "checkbox",
                        value: _items.guid,
                        onChange: this.handleChange
                        // checked: _items.isChecked
                    }),
                _items.caption
            )
        );

    }

    componentWillReceiveProps(nextProps: ContainerProps) {
        if (nextProps.mxObject) {
            this.resetSubscriptions(nextProps.mxObject);
            this.fetchData();
               } else {
            this.setState({ checkboxItems: [] });
        }
    }
    private getDataFromXPath(mxObject: mendix.lib.MxObject) {
        const constraint = this.props.constraint
            ? this.props.constraint.replace(/\[\%CurrentObject\%\]/gi, mxObject.getGuid())
            : "";
        const xpath = "//" + this.entity + constraint;
        mx.data.get({
            xpath,
            filter: {
                sort: [ [ this.props.displayAttribute, "asc" ] ],
                offset: 0,
                amount: 50
            },
            callback: objects => {
                this.processItems(objects);
            }
        });
    }

    private resetSubscriptions(mxObject: mendix.lib.MxObject) {
        this.subscriptionHandles.forEach(window.mx.data.unsubscribe);
        this.subscriptionHandles = [];

        this.subscriptionHandles.push(window.mx.data.subscribe({
            guid: mxObject.getGuid(),
            attr: this.props.displayAttribute,
            callback: () => this.fetchData
        }));
        this.subscriptionHandles.push(window.mx.data.subscribe({
                guid: mxObject.getGuid(),
                callback: () => this.fetchData
            }));
    }

    private fetchData() {
        if (this.props.dataSource === "xpath") {
            this.getDataFromXPath(this.props.mxObject);
        } else {
            this.getDataFromMicroflow();
        }
    }

    private getDataFromMicroflow() {
        mx.data.action({
            params: {
                applyto: "selection",
                actionname: this.props.callMicroflow
            },
            origin: this.props.mxform,
            callback: (mxObject: mendix.lib.MxObject[]) => this.processItems(mxObject),
            error: (error) => {
                mx.ui.error(error.message);
            }
        });
    }

    private handleChange(event: any) {
        const newEvent = event.target;
        if (newEvent && newEvent.checked) {
            if (this.props.mxObject && this.state.isChecked) {
                this.props.mxObject.addReferences(this.reference, [ event.target.value ]);
            } else {
                this.props.mxObject.removeReferences(this.reference, [
                    event.target.value ]);
            }
    }
}

    private processItems = (itemObjects: mendix.lib.MxObject[]) => {
        if (itemObjects.length > 0) {
            const checkboxItems = itemObjects.map(mxObj => {
                let isChecked = false;
                const caption = mxObj.get("Name");
                const referencedObjects = this.props.mxObject.getReferences(this.reference) as string[];
                if (referencedObjects !== null && referencedObjects.length > 0) {
                    referencedObjects.map(value => {
                        if (mxObj.getGuid() === value) {
                            isChecked = true;
                        }
                    });
                }
                return {
                    guid: mxObj.getGuid(),
                    caption,
                    isChecked
                };
            });
            this.setState({ checkboxItems, isChecked: true });
    }
        // tslint:disable-next-line:no-console
        console.log(this.state.checkboxItems);
}
    public static parseStyle(style = ""): { [key: string]: string } {
    try {
        return style.split(";").reduce<{ [key: string]: string }>((styleObject, line) => {
            const pair = line.split(":");
            if (pair.length === 2) {
                const name = pair[0].trim().replace(/(-.)/g, match => match[1].toUpperCase());
                styleObject[name] = pair[1].trim();
            }
            return styleObject;
        }, {});
    } catch (error) {
        CheckBoxReferenceSetSelectorContainer.logError("Failed to parse style", style, error);
    }

    return {};
}

    // tslint:disable-next-line:align
    public static logError(message: string, style ?: string, error ?: any) {
    // tslint:disable-next-line:no-console
    window.logger ? window.logger.error(message) : console.log(message, style, error);
  }
}
