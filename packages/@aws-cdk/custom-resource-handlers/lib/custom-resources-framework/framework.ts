/* eslint-disable import/no-extraneous-dependencies */
import { InterfaceType, Module, TypeScriptRenderer } from '@cdklabs/typewriter';
import * as fs from 'fs-extra';
import { ProviderFrameworkClass, ProviderFrameworkClassProps } from './classes';
import { ComponentType, ComponentProps } from './config';
import { ModuleImportOptions, ModuleImporter } from './module-importer';
import { ImportableModule } from './modules';
import { buildComponentName } from './utils/framework-utils';

export class ProviderFrameworkModule extends Module {
  private readonly renderer = new TypeScriptRenderer();
  private readonly importer = new ModuleImporter();
  private readonly _interfaces = new Map<string, InterfaceType>();
  private _hasComponents = false;

  /**
   * Whether the module being generated will live inside of aws-cdk-lib/core.
   */
  public readonly isCoreInternal: boolean;

  /**
   * Whether the module contains provider framework components.
   */
  public get hasComponents() {
    return this._hasComponents;
  }

  public constructor(fqn: string) {
    super(fqn);
    this.isCoreInternal = fqn.includes('core');
  }

  /**
   * Build a framework component inside of this module.
   */
  public build(component: ComponentProps, codeDirectory: string) {
    if (component.type === ComponentType.NO_OP) {
      return;
    }

    this._hasComponents = true;

    const handler = component.handler ?? 'index.handler';
    const name = buildComponentName(this.fqn, component.type, handler);

    const props: ProviderFrameworkClassProps = {
      name,
      handler,
      codeDirectory,
      runtime: component.runtime,
    };

    switch (component.type) {
      case ComponentType.FUNCTION: {
        ProviderFrameworkClass.buildFunction(this, props);
        break;
      }
      case ComponentType.SINGLETON_FUNCTION: {
        ProviderFrameworkClass.buildSingletonFunction(this, props);
        break;
      }
      case ComponentType.CUSTOM_RESOURCE_PROVIDER: {
        ProviderFrameworkClass.buildCustomResourceProvider(this, props);
        break;
      }
    }
  }

  /**
   * Render module with components into an output file.
   */
  public renderTo(file: string) {
    this.importer.importModulesInto(this);
    fs.outputFileSync(file, this.renderer.render(this));
  }

  /**
   * Register an external module to be imported into this module.
   */
  public registerImport(module: ImportableModule, options: ModuleImportOptions = {}) {
    this.importer.registerImport(module, options);
  }

  /**
   * Register an interface with this module.
   */
  public registerInterface(_interface: InterfaceType) {
    this._interfaces.set(_interface.name, _interface);
  }

  /**
   * Retrieve an interface that has been registered with this module.
   */
  public getInterface(name: string) {
    return this._interfaces.get(name);
  }
}
