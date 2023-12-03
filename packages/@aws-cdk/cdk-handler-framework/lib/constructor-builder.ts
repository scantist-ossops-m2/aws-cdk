import { Expression, ParameterSpec, Type, stmt, expr, SuperInitializer, StructType, ObjectLiteral, Splat } from '@cdklabs/typewriter';
import { CdkHandlerFrameworkClass } from './class-builder';
import { CONSTRUCTS_MODULE, LAMBDA_MODULE } from './imports';

interface ConstructorOptions {
  readonly constructorPropsParam?: ParameterSpec,
  readonly superProps?: Expression,
}

export abstract class CdkHandlerFrameworkConstructor {
  public static forCdkFunction(_class: CdkHandlerFrameworkClass) {
    const constructorPropsParam: ParameterSpec = {
      name: 'props',
      type: LAMBDA_MODULE.FunctionOptions,
    };
    const superProps = new ObjectLiteral([
      new Splat(expr.directCode('props')),
      ['code', expr.directCode('cdkHandler.code')],
      ['handler', expr.directCode('cdkHandler.entrypoint')],
      ['runtime', expr.directCode('cdkHandler.runtime')],
    ]);
    CdkHandlerFrameworkConstructor.forCdkHandlerFrameworkClass(_class, { constructorPropsParam, superProps });
  }

  public static forCdkSingletonFunction(_class: CdkHandlerFrameworkClass) {
    const cdkSingletonFunctionProps = new StructType(_class, {
      name: 'CdkSingletonFunctionProps',
      extends: [LAMBDA_MODULE.FunctionOptions],
      export: true,
    });
    cdkSingletonFunctionProps.addProperty({
      name: 'uuid',
      type: Type.STRING,
    });
    cdkSingletonFunctionProps.addProperty({
      name: 'lambdaPurpose',
      type: Type.STRING,
      optional: true,
    });
    const constructorPropsParam: ParameterSpec = {
      name: 'props',
      type: cdkSingletonFunctionProps.type,
    };
    const superProps = new ObjectLiteral([
      new Splat(expr.directCode('props')),
      ['code', expr.directCode('cdkHandler.code')],
      ['handler', expr.directCode('cdkHandler.entrypoint')],
      ['runtime', expr.directCode('cdkHandler.runtime')],
    ]);
    CdkHandlerFrameworkConstructor.forCdkHandlerFrameworkClass(_class, { constructorPropsParam, superProps });
  }

  public static forCdkCustomResourceProvider(_class: CdkHandlerFrameworkClass) {}

  private static forCdkHandlerFrameworkClass(_class: CdkHandlerFrameworkClass, constructorOptions: ConstructorOptions = {}) {
    // constructor
    const init = _class.addInitializer({});
    const scope = init.addParameter({
      name: 'scope',
      type: CONSTRUCTS_MODULE.Construct,
    });
    const id = init.addParameter({
      name: 'id',
      type: Type.STRING,
    });
    if (constructorOptions.constructorPropsParam) {
      init.addParameter(constructorOptions.constructorPropsParam);
    }

    // build CdkHandler instance
    init.addBody(
      stmt.constVar(
        expr.ident('cdkHandlerProps'),
        expr.object({
          codeDirectory: expr.lit(`${_class.codeDirectory}`),
          entrypoint: _class.entrypoint
            ? expr.lit(`${_class.entrypoint}`)
            : expr.lit('index.handler'),
        }),
      ),
    );
    init.addBody(
      stmt.constVar(
        expr.ident('cdkHandler'),
        expr.directCode("new CdkHandler(scope, 'Handler', cdkHandlerProps)"),
      ),
    );

    // build super call
    const superInitializerArgs: Expression[] = [scope, id];
    if (constructorOptions.superProps) {
      superInitializerArgs.push(constructorOptions.superProps);
    }
    init.addBody(new SuperInitializer(...superInitializerArgs));
  }
}