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
}

// tslint:disable-next-line:interface-over-type-literal
export type CheckboxItems = {
    caption?: string | number | boolean,
    guid: string;
};

interface ContainerState {
    checkboxItems: CheckboxItems[];
    isChecked: boolean;
}

export default class CheckBoxReferenceSetSelectorContainer extends Component<ContainerProps, ContainerState> {
    readonly state: ContainerState = {
        checkboxItems: [],
        isChecked: false
    };
    private entity: string;
    private reference: string;
    mxObj: mendix.lib.MxObject;
    constructor(props: ContainerProps) {
        super(props);

        this.handleChange = this.handleChange.bind(this);
        this.entity = this.props.entity.split("/")[1];
        this.reference = this.props.entity.split("/")[0];
        this.getDataFromXPath = this.getDataFromXPath.bind(this);
        this.handleChange = this.handleChange.bind(this);
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
                    }),
                _items.caption
            )
        );

    }

    componentWillReceiveProps(nextProps: ContainerProps) {
        if (nextProps.mxObject) {
            this.getDataFromXPath(nextProps.mxObject);
        } else {
            this.setState({ checkboxItems: [] });
        }
    }

    private getDataFromXPath(mxObject: mendix.lib.MxObject) {
        const constraint = this.props.constraint
            ? this.props.constraint.replace(/\[\%CurrentObject\%\]/gi, mxObject.getGuid())
            : "";
        const XPath = "//" + this.entity + constraint;
        mx.data.get({
            xpath: XPath,
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

    private handleChange(event: any) {
        const newEvent = event.target;
        if (newEvent && newEvent.checked) {
            this.props.mxObject.addReferences(this.reference, [ event.target.value ]);
        } else {
            this.props.mxObject.removeReferences(this.reference, [ event.target.value ]);
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

    public static logError(message: string, style?: string, error?: any) {
        // tslint:disable-next-line:no-console
        window.logger ? window.logger.error(message) : console.log(message, style, error);
    }
}
